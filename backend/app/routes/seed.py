from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db, Base, engine
from app.models.user import User, RoleEnum
from app.models.category import Category
from app.models.issue_group import IssueGroup, IssueStatus, IssuePriority
from app.models.report import Report, ReportStatus
from app.models.ai_suggestion import AISuggestion
from app.models.assignment import Assignment, AssignmentStatus
from app.models.status_history import StatusHistory
from app.models.evidence import Evidence, EvidenceType
from app.models.feedback import Feedback
from app.utils.security import get_password_hash

router = APIRouter(prefix="/seed", tags=["Database Seed"])

DEFAULT_CATEGORIES = [
    {"name": "Pothole", "slug": "pothole", "icon": "alert-triangle", "description": "Road surface holes, craters, and asphalt depressions causing vehicular hazards.", "default_sla_hours": 24},
    {"name": "Garbage", "slug": "garbage", "icon": "trash-2", "description": "Overflowing waste bins, illegal dumping, littering, and unsanitary conditions.", "default_sla_hours": 12},
    {"name": "Streetlight", "slug": "streetlight", "icon": "zap", "description": "Damaged poles, burnt-out bulbs, flickering lamps, and unsafe dark corridors.", "default_sla_hours": 24},
    {"name": "Water Leakage", "slug": "water-leakage", "icon": "droplet", "description": "Burst municipal pipelines, valve leaks, and potable water wastage.", "default_sla_hours": 18},
    {"name": "Drainage", "slug": "drainage", "icon": "waves", "description": "Blocked storm drains, sewage overflows, and stagnant waterlogging.", "default_sla_hours": 24},
    {"name": "Road Damage", "slug": "road-damage", "icon": "shield-alert", "description": "Cracked pavement, missing dividers, damaged speed bumps, and cave-ins.", "default_sla_hours": 48},
    {"name": "Public Property", "slug": "public-property", "icon": "landmark", "description": "Damaged park benches, broken bus shelters, railings, and playground fixtures.", "default_sla_hours": 72},
    {"name": "Other", "slug": "other", "icon": "help-circle", "description": "General civic maintenance inquiries and miscellaneous municipal issues.", "default_sla_hours": 48}
]

def seed_database_internal(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # 1. Seed Categories
    category_map = {}
    for cat_data in DEFAULT_CATEGORIES:
        cat = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not cat:
            cat = Category(**cat_data)
            db.add(cat)
            db.flush()
        category_map[cat.slug] = cat

    # 2. Seed Default Accounts
    demo_users = [
        {
            "email": "admin@civicpulse.org",
            "password": "admin123",
            "full_name": "Commissioner Rajesh Verma",
            "phone": "+91 98765 43210",
            "role": RoleEnum.ADMIN.value
        },
        {
            "email": "worker@civicpulse.org",
            "password": "worker123",
            "full_name": "Suresh Kumar (Field Tech Lead)",
            "phone": "+91 98450 11223",
            "role": RoleEnum.WORKER.value
        },
        {
            "email": "worker2@civicpulse.org",
            "password": "worker123",
            "full_name": "Anil Rao (Road Works Specialist)",
            "phone": "+91 98450 44556",
            "role": RoleEnum.WORKER.value
        },
        {
            "email": "citizen@civicpulse.org",
            "password": "citizen123",
            "full_name": "Priya Sharma (Citizen A)",
            "phone": "+91 91234 56789",
            "role": RoleEnum.CITIZEN.value
        },
        {
            "email": "citizen2@civicpulse.org",
            "password": "citizen123",
            "full_name": "Vikram Patel (Citizen B)",
            "phone": "+91 99887 76655",
            "role": RoleEnum.CITIZEN.value
        }
    ]

    user_map = {}
    for u_data in demo_users:
        user = db.query(User).filter(User.email == u_data["email"]).first()
        if not user:
            user = User(
                email=u_data["email"],
                hashed_password=get_password_hash(u_data["password"]),
                full_name=u_data["full_name"],
                phone=u_data["phone"],
                role=u_data["role"],
                is_active=True
            )
            db.add(user)
            db.flush()
        user_map[u_data["email"]] = user

    # 3. Seed Realistic Sample Issues
    # Check if issues already seeded
    if db.query(IssueGroup).count() == 0:
        admin_user = user_map["admin@civicpulse.org"]
        worker_user = user_map["worker@civicpulse.org"]
        citizen_a = user_map["citizen@civicpulse.org"]
        citizen_b = user_map["citizen2@civicpulse.org"]

        # Issue 1: Large pothole near MG Road (In Progress)
        issue1 = IssueGroup(
            reference_code="CP-2026-1001",
            title="Dangerous 2ft crater on MG Road Junction",
            description="Severe deep pothole causing two-wheelers to skid near metro pillar 124. Heavy traffic zone.",
            category_id=category_map["pothole"].id,
            latitude=12.9716,
            longitude=77.5946,
            location_address="MG Road, near Metro Pillar 124, Central Ward, Bengaluru",
            status=IssueStatus.IN_PROGRESS.value,
            priority=IssuePriority.HIGH.value,
            priority_verified_by_admin=True,
            verified_by_user_id=admin_user.id,
            verified_at=datetime.utcnow() - timedelta(days=2),
            verification_remarks="Verified by Ward Officer. Critical traffic corridor."
        )
        db.add(issue1)
        db.flush()

        rep1 = Report(
            complaint_id="CIT-10492",
            citizen_id=citizen_a.id,
            issue_group_id=issue1.id,
            category_id=category_map["pothole"].id,
            title="Deep pothole on MG Road",
            description="Very bad pothole near the metro station entrance. Saw an auto rickshaw nearly flip over.",
            latitude=12.9716,
            longitude=77.5946,
            location_address="MG Road, near Metro Pillar 124, Central Ward, Bengaluru",
            status=ReportStatus.LINKED.value,
            image_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80"
        )
        db.add(rep1)
        db.flush()

        # Assignment for worker
        assign1 = Assignment(
            issue_group_id=issue1.id,
            worker_id=worker_user.id,
            assigned_by_id=admin_user.id,
            status=AssignmentStatus.IN_PROGRESS.value,
            notes="Hot-mix asphalt patch required immediately. Clear area with cones.",
            assigned_at=datetime.utcnow() - timedelta(days=1, hours=12),
            accepted_at=datetime.utcnow() - timedelta(days=1, hours=10)
        )
        db.add(assign1)

        # Before evidence photo
        ev1 = Evidence(
            issue_group_id=issue1.id,
            uploaded_by_id=worker_user.id,
            evidence_type=EvidenceType.BEFORE_REPAIR.value,
            image_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
            remarks="Work site cordoned off. Preparing bitumen leveling."
        )
        db.add(ev1)

        # Status History
        db.add(StatusHistory(
            issue_group_id=issue1.id,
            changed_by_user_id=citizen_a.id,
            from_status="NONE",
            to_status=IssueStatus.REPORTED.value,
            remarks="Citizen reported pothole hazard."
        ))
        db.add(StatusHistory(
            issue_group_id=issue1.id,
            changed_by_user_id=admin_user.id,
            from_status=IssueStatus.REPORTED.value,
            to_status=IssueStatus.VERIFIED.value,
            remarks="Priority verified as HIGH by municipal administrator."
        ))
        db.add(StatusHistory(
            issue_group_id=issue1.id,
            changed_by_user_id=admin_user.id,
            from_status=IssueStatus.VERIFIED.value,
            to_status=IssueStatus.ASSIGNED.value,
            remarks=f"Assigned to {worker_user.full_name}."
        ))
        db.add(StatusHistory(
            issue_group_id=issue1.id,
            changed_by_user_id=worker_user.id,
            from_status=IssueStatus.ASSIGNED.value,
            to_status=IssueStatus.IN_PROGRESS.value,
            remarks="Field crew on site. Bitumen heating in progress."
        ))

        # Issue 2: Overflowing garbage in Indiranagar (Pending Verification)
        issue2 = IssueGroup(
            reference_code="CP-2026-1002",
            title="Garbage bin overflow near 100ft Road Market",
            description="Commercial garbage piled outside waste dumpster, blocking pedestrian walkway with foul odor.",
            category_id=category_map["garbage"].id,
            latitude=12.9784,
            longitude=77.6408,
            location_address="100 Feet Rd, Defence Colony, Indiranagar, Bengaluru",
            status=IssueStatus.PENDING_VERIFICATION.value,
            priority=IssuePriority.MEDIUM.value,
            priority_verified_by_admin=True,
            verified_by_user_id=admin_user.id,
            verified_at=datetime.utcnow() - timedelta(days=1),
            verification_remarks="Sanitation priority."
        )
        db.add(issue2)
        db.flush()

        rep2 = Report(
            complaint_id="CIT-10493",
            citizen_id=citizen_b.id,
            issue_group_id=issue2.id,
            category_id=category_map["garbage"].id,
            title="Massive trash dump on walkway",
            description="Stinking waste spilling onto the road. Please clear immediately.",
            latitude=12.9784,
            longitude=77.6408,
            location_address="100 Feet Rd, Defence Colony, Indiranagar, Bengaluru",
            status=ReportStatus.LINKED.value,
            image_url="https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80"
        )
        db.add(rep2)

        ev2 = Evidence(
            issue_group_id=issue2.id,
            uploaded_by_id=worker_user.id,
            evidence_type=EvidenceType.AFTER_REPAIR.value,
            image_url="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
            remarks="Waste cleared with compaction truck. Area sanitized with bleaching powder."
        )
        db.add(ev2)

        # Issue 3: Resolved Streetlight on 12th Main Road
        issue3 = IssueGroup(
            reference_code="CP-2026-0988",
            title="Dark street due to broken LED light fixture",
            description="Street lamp completely dark for 3 days, causing security concerns for residents.",
            category_id=category_map["streetlight"].id,
            latitude=12.9352,
            longitude=77.6245,
            location_address="12th Main, 4th Block, Koramangala, Bengaluru",
            status=IssueStatus.RESOLVED.value,
            priority=IssuePriority.MEDIUM.value,
            priority_verified_by_admin=True,
            verified_by_user_id=admin_user.id,
            verified_at=datetime.utcnow() - timedelta(days=4),
            resolved_at=datetime.utcnow() - timedelta(hours=8)
        )
        db.add(issue3)
        db.flush()

        rep3 = Report(
            complaint_id="CIT-09882",
            citizen_id=citizen_a.id,
            issue_group_id=issue3.id,
            category_id=category_map["streetlight"].id,
            title="Dark lamp post #14",
            description="Bulb broken, street pitch dark at night.",
            latitude=12.9352,
            longitude=77.6245,
            location_address="12th Main, 4th Block, Koramangala, Bengaluru",
            status=ReportStatus.RESOLVED.value,
            image_url="https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=600&q=80"
        )
        db.add(rep3)

        # After repair evidence
        ev3 = Evidence(
            issue_group_id=issue3.id,
            uploaded_by_id=worker_user.id,
            evidence_type=EvidenceType.AFTER_REPAIR.value,
            image_url="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80",
            remarks="Replaced faulty driver unit and installed new 90W Philips LED luminaire.",
            is_verified_by_admin=True,
            verified_at=datetime.utcnow() - timedelta(hours=8)
        )
        db.add(ev3)

        # Citizen feedback
        fb = Feedback(
            issue_group_id=issue3.id,
            citizen_id=citizen_a.id,
            rating=5,
            comments="Prompt action taken within 24 hours! Street is bright and safe again. Thank you CivicPulse team!",
            request_reopen=False
        )
        db.add(fb)

    db.commit()
    return {"status": "success", "message": "Demo data and categories seeded successfully."}

@router.post("")
def seed_endpoint(db: Session = Depends(get_db)):
    return seed_database_internal(db)

