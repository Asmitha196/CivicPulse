import re
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.utils.geo import calculate_haversine_distance

logger = logging.getLogger("civicpulse.ai")

# Check if sentence-transformers is available
SENTENCE_TRANSFORMER_AVAILABLE = False
st_model = None

try:
    from sentence_transformers import SentenceTransformer
    # If the user or environment has it, load lightly
    st_model = SentenceTransformer("all-MiniLM-L6-v2")
    SENTENCE_TRANSFORMER_AVAILABLE = True
    logger.info("[AI Engine] SentenceTransformer (all-MiniLM-L6-v2) loaded successfully.")
except Exception as e:
    logger.info(f"[AI Engine] SentenceTransformer not loaded ({e}). Using local TF-IDF Cosine Semantic Fallback.")
    SENTENCE_TRANSFORMER_AVAILABLE = False

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

CATEGORY_KEYWORDS = {
    "Pothole": [
        "pothole", "crater", "road hole", "asphalt", "broken road", "trench in road", 
        "depression", "car bump", "bike skid", "road dip", "manhole open"
    ],
    "Garbage": [
        "garbage", "trash", "waste", "bin overflowing", "litter", "rubbish", "dumpsite",
        "stench", "refuse", "dumping", "smelly waste", "cleanliness"
    ],
    "Streetlight": [
        "streetlight", "street light", "lamp post", "dark road", "bulb broken", "no light",
        "flickering light", "night safety", "pole damaged", "blackout street"
    ],
    "Water Leakage": [
        "water leak", "pipeline burst", "broken pipe", "drinking water", "leaking valve",
        "water supply", "gushing water", "water line break", "pipe cracked"
    ],
    "Drainage": [
        "drainage", "clogged drain", "sewage", "gutter", "waterlogged", "drain overflow",
        "blocked sewer", "manhole overflowing", "storm drain", "stagnant water"
    ],
    "Road Damage": [
        "road damage", "speed breaker", "cracked pavement", "cave in", "sinkhole",
        "divider broken", "sidewalk broken", "road caving", "curb damaged"
    ],
    "Public Property": [
        "park bench", "bus stop", "bus shelter", "railing", "public toilet", "playground",
        "swing broken", "statue damaged", "graffiti", "fence broken", "boundary wall"
    ]
}

SAFETY_CRITICAL_TERMS = [
    "accident", "injury", "danger", "hazard", "exposed wire", "electric shock", "cave in",
    "hospital", "school", "fatal", "sparking", "open manhole", "deep crater", "flooding inside"
]

HIGH_SEVERITY_TERMS = [
    "heavy traffic", "burst", "overflowing badly", "complete dark", "major leak", "blocked access",
    "pedestrian risk", "severe", "arterial road", "water wasted"
]

class AIService:
    @classmethod
    def calculate_text_similarity(cls, text1: str, text2: str) -> Tuple[float, str, bool]:
        """
        Calculates semantic similarity between two complaint texts.
        Returns (similarity_score, model_name, is_fallback)
        """
        if not text1 or not text2:
            return 0.0, "EmptyText", True

        if SENTENCE_TRANSFORMER_AVAILABLE and st_model is not None:
            try:
                embeddings = st_model.encode([text1, text2])
                score = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
                score = max(0.0, min(1.0, score))
                return round(score, 4), "sentence-transformers/all-MiniLM-L6-v2", False
            except Exception as e:
                logger.warning(f"SentenceTransformer inference error: {e}. Falling back.")

        # Local Civic Semantic Similarity Engine (TF-IDF + Domain Keyword & Token Matching)
        try:
            # 1. Char n-gram similarity
            vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5), sublinear_tf=True)
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            char_sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])

            # 2. Token overlap & Category concept overlap
            t1_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', text1.lower()))
            t2_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', text2.lower()))
            overlap = t1_words & t2_words

            # Check if both share key category keywords
            shared_civic_terms = 0
            for cat, kws in CATEGORY_KEYWORDS.items():
                in_t1 = any(k in text1.lower() for k in kws)
                in_t2 = any(k in text2.lower() for k in kws)
                if in_t1 and in_t2:
                    shared_civic_terms += 1

            token_jaccard = len(overlap) / len(t1_words | t2_words) if (t1_words | t2_words) else 0.0

            # Composite weighted similarity score (0.0 to 1.0)
            score = (char_sim * 0.40) + (token_jaccard * 0.35) + (min(shared_civic_terms, 2) * 0.15)
            score = round(min(0.98, max(0.0, score * 1.5)), 4)
            return score, "CivicPulse Local TF-IDF & Semantic Domain Vectorizer (Local Fallback)", True
        except Exception as e:
            return 0.5, "CivicPulse Heuristic Matcher Fallback", True

    @staticmethod
    def classify_category(text: str) -> Dict[str, Any]:
        """
        Suggests issue category from citizen description.
        Returns category prediction, confidence, model name, and alternatives.
        """
        cleaned_text = text.lower()
        scores = {}

        for category, keywords in CATEGORY_KEYWORDS.items():
            cat_score = 0
            for kw in keywords:
                if kw in cleaned_text:
                    # Give higher weight to exact phrases
                    cat_score += 2.5 if len(kw.split()) > 1 else 1.5
            scores[category] = cat_score

        best_category = max(scores, key=scores.get)
        max_score = scores[best_category]

        if max_score == 0:
            best_category = "Other"
            confidence = 0.40
        else:
            # Normalization
            total_score = sum(scores.values())
            raw_conf = max_score / total_score if total_score > 0 else 0.5
            confidence = round(min(0.96, max(0.55, raw_conf + 0.15)), 2)

        suggestions = []
        for cat, sc in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]:
            suggestions.append({
                "category": cat,
                "score": round(sc, 2),
                "matched": sc > 0
            })

        return {
            "category_name": best_category,
            "confidence": confidence,
            "model_name": "CivicPulse Local Distil-Heuristic NLP Classifier",
            "is_fallback": True,
            "suggestions": suggestions
        }

    @staticmethod
    def recommend_priority(
        description: str,
        category: str,
        affected_count: int = 1
    ) -> Dict[str, Any]:
        """
        Rule-based priority recommendation considering public safety, severity,
        issue type, and affected citizen count.
        """
        desc_lower = description.lower()
        score = 20  # Base score for Medium

        critical_matches = [w for w in SAFETY_CRITICAL_TERMS if w in desc_lower]
        high_matches = [w for w in HIGH_SEVERITY_TERMS if w in desc_lower]

        if critical_matches:
            score += 50
        elif high_matches:
            score += 30

        # Category sensitivity
        if category in ["Water Leakage", "Drainage"]:
            score += 15
        elif category in ["Streetlight"]:
            score += 10
        elif category in ["Pothole"]:
            score += 15

        # Duplicate/impact scaling
        if affected_count >= 5:
            score += 25
        elif affected_count >= 2:
            score += 10

        if score >= 70 or len(critical_matches) > 0:
            suggested = "CRITICAL"
            reasoning = f"Public safety hazard detected ({', '.join(critical_matches) if critical_matches else 'Multiple high-risk indicators'}). Immediate intervention recommended."
        elif score >= 45:
            suggested = "HIGH"
            reasoning = f"Significant civic disturbance or potential risk detected ({', '.join(high_matches) if high_matches else 'Elevated impact score'})."
        elif score >= 25:
            suggested = "MEDIUM"
            reasoning = "Standard civic problem requiring scheduled maintenance."
        else:
            suggested = "LOW"
            reasoning = "Minor cosmetic or low-risk civic maintenance task."

        return {
            "suggested_priority": suggested,
            "reasoning": reasoning,
            "confidence": 0.88,
            "factors": {
                "critical_terms": critical_matches,
                "high_terms": high_matches,
                "category_weight": category,
                "affected_citizens_count": affected_count,
                "composite_score": score
            },
            "model_name": "CivicPulse Multi-Factor Civic Safety Priority Engine",
            "is_fallback": False
        }

    @classmethod
    def find_potential_duplicates(
        cls,
        new_title: str,
        new_description: str,
        new_lat: float,
        new_lon: float,
        existing_issue_groups: List[Any],
        distance_threshold_meters: float = 350.0,
        similarity_threshold: float = 0.50
    ) -> Dict[str, Any]:
        """
        Compares a newly reported issue with existing active IssueGroups.
        Calculates geographic distance and semantic text similarity.
        """
        new_text = f"{new_title}. {new_description}"
        potential_duplicates = []

        for group in existing_issue_groups:
            # Skip resolved or rejected groups
            if group.status in ["RESOLVED", "REJECTED"]:
                continue

            dist_meters = calculate_haversine_distance(
                new_lat, new_lon,
                group.latitude, group.longitude
            )

            # Only check semantic similarity if within reasonable geographic proximity
            if dist_meters <= distance_threshold_meters:
                group_text = f"{group.title}. {group.description}"
                sim_score, model_name, is_fb = cls.calculate_text_similarity(new_text, group_text)

                # If either distance is very close (< 80m) and text similarity > 0.45
                # OR distance < 350m and text similarity >= 0.55
                is_duplicate_candidate = False
                if dist_meters <= 80.0 and sim_score >= 0.25:
                    is_duplicate_candidate = True
                elif dist_meters <= 200.0 and sim_score >= 0.40:
                    is_duplicate_candidate = True
                elif dist_meters <= distance_threshold_meters and sim_score >= similarity_threshold:
                    is_duplicate_candidate = True

                if is_duplicate_candidate:
                    potential_duplicates.append({
                        "issue_group_id": group.id,
                        "reference_code": group.reference_code,
                        "title": group.title,
                        "description": group.description,
                        "distance_meters": dist_meters,
                        "similarity_score": sim_score,
                        "category_name": group.category.name if group.category else "General",
                        "status": group.status,
                        "created_at": group.created_at.isoformat() if group.created_at else ""
                    })

        # Sort duplicates by closest combination of high similarity and lowest distance
        potential_duplicates.sort(key=lambda x: (x["similarity_score"] * 1000 - x["distance_meters"]), reverse=True)

        return {
            "has_potential_duplicates": len(potential_duplicates) > 0,
            "duplicates": potential_duplicates,
            "model_name": "all-MiniLM-L6-v2 + PostGIS/Haversine Geodesic Matcher" if SENTENCE_TRANSFORMER_AVAILABLE else "CivicPulse Hybrid Semantic & Geodesic Distance Engine",
            "is_fallback": not SENTENCE_TRANSFORMER_AVAILABLE
        }
