import random
import string
from datetime import datetime

def generate_complaint_id() -> str:
    """Generates a unique complaint ID like CIT-74829"""
    digits = ''.join(random.choices(string.digits, k=5))
    return f"CIT-{digits}"

def generate_reference_code() -> str:
    """Generates a unique issue reference code like CP-2026-0482"""
    year = datetime.utcnow().year
    digits = ''.join(random.choices(string.digits, k=4))
    return f"CP-{year}-{digits}"

