import asyncio
import httpx
from app.main import app
from app.database.session import Base, engine, SessionLocal
from app.routes.seed import seed_database_internal

async def run_full_workflow_test():
    print("\n=======================================================", flush=True)
    print("   CIVICPULSE – 15-STAGE DEMONSTRATION WORKFLOW TEST", flush=True)
    print("=======================================================\n", flush=True)

    # 1. Initialize tables and database seed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database_internal(db)
    db.close()

    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=15.0) as client:
        # Check Health
        health_res = await client.get("/api/health")
        assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
        print("[STAGE 0] Backend API Healthy:", health_res.json(), flush=True)

        # STAGE 1: Citizen A Login
        login_a = await client.post("/api/auth/login", json={
            "email": "citizen@civicpulse.org",
            "password": "citizen123"
        })
        assert login_a.status_code == 200, f"Citizen A login failed: {login_a.text}"
        token_a = login_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}
        print("[STAGE 1] Citizen A Authenticated successfully.", flush=True)

        # Fetch Category: Pothole
        cat_res = await client.get("/api/categories")
        assert cat_res.status_code == 200
        pothole_cat = next(c for c in cat_res.json() if c["slug"] == "pothole")

        # STAGE 2: Citizen A submits pothole complaint with photograph and GPS location
        pothole_lat, pothole_lon = 12.9298, 77.6845
        report_a = await client.post("/api/reports/submit", headers=headers_a, json={
            "title": "Severe road crater opposite Bellandur Gate",
            "description": "Massive 2-foot deep pothole in outer lane causing two-wheelers to crash. Very dangerous at night.",
            "category_id": pothole_cat["id"],
            "latitude": pothole_lat,
            "longitude": pothole_lon,
            "location_address": "Bellandur Outer Ring Road, Ward 150",
            "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80"
        })
        assert report_a.status_code == 200, f"Report A submission failed: {report_a.text}"
        data_a = report_a.json()
        complaint_a_id = data_a["complaint_id"]
        issue_group_id = data_a["issue_group_id"]
        assert complaint_a_id.startswith("CIT-")
        print(f"[STAGE 2] Citizen A received Unique Complaint ID: {complaint_a_id} (Issue Group: {issue_group_id})", flush=True)

        # STAGE 3: Citizen B Login & Submits complaint about the same pothole
        login_b = await client.post("/api/auth/login", json={
            "email": "citizen2@civicpulse.org",
            "password": "citizen123"
        })
        assert login_b.status_code == 200
        token_b = login_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Location ~30 meters away
        report_b = await client.post("/api/reports/submit", headers=headers_b, json={
            "title": "Dangerous deep pothole near Bellandur bus stop",
            "description": "Deep asphalt hole on outer ring road. Two bike skids witnessed today morning. Immediate repair needed.",
            "category_id": pothole_cat["id"],
            "latitude": pothole_lat + 0.0002,
            "longitude": pothole_lon + 0.0002,
            "location_address": "Bellandur Gate Outer Ring Road",
            "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80"
        })
        assert report_b.status_code == 200
        data_b = report_b.json()
        complaint_b_id = data_b["complaint_id"]

        # STAGE 4: AI detects potential duplicate
        ai_sugg = data_b["ai_suggestion"]
        assert ai_sugg is not None
        assert ai_sugg["duplicate_detected"] is True
        print(f"[STAGE 3 & 4] Citizen B filed #{complaint_b_id} -> AI Flagged Duplicate Candidate!", flush=True)
        print(f"            • Semantic Similarity: {ai_sugg['similarity_score']}", flush=True)
        print(f"            • Geodesic Distance:   {ai_sugg['distance_meters']}m", flush=True)
        print(f"            • Model Engine:        {ai_sugg['model_name']}", flush=True)

        # STAGE 5 & 6: Administrator Reviews both complaints and merges into one IssueGroup
        admin_login = await client.post("/api/auth/login", json={
            "email": "admin@civicpulse.org",
            "password": "admin123"
        })
        assert admin_login.status_code == 200
        token_admin = admin_login.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {token_admin}"}

        merge_res = await client.post(f"/api/issues/{issue_group_id}/merge", headers=headers_admin, json={
            "secondary_report_id": data_b["id"],
            "admin_notes": "Both citizen reports verified as same physical crater on Bellandur ORR.",
            "status": "APPROVED"
        })
        assert merge_res.status_code == 200
        merged_group = merge_res.json()
        assert merged_group["reports_count"] >= 2
        print(f"[STAGE 5 & 6] Administrator approved duplicate grouping into master ticket {merged_group['reference_code']} ({merged_group['reports_count']} reports linked).", flush=True)

        # STAGE 7: Administrator verifies severity and priority
        verify_res = await client.post(f"/api/issues/{issue_group_id}/verify", headers=headers_admin, json={
            "priority": "CRITICAL",
            "verification_remarks": "High-speed arterial road. High risk of fatal motorcycle skids."
        })
        assert verify_res.status_code == 200
        assert verify_res.json()["priority"] == "CRITICAL"
        print(f"[STAGE 7] Administrator verified severity: Priority set to CRITICAL.", flush=True)

        # STAGE 8: Administrator assigns a field worker
        workers_res = await client.get("/api/auth/workers", headers=headers_admin)
        assert workers_res.status_code == 200
        worker_user = workers_res.json()[0]

        assign_res = await client.post("/api/assignments", headers=headers_admin, json={
            "issue_group_id": issue_group_id,
            "worker_id": worker_user["id"],
            "notes": "Emergency cold-mix asphalt patch required. Cordon off lane with cones."
        })
        assert assign_res.status_code == 200
        assignment_id = assign_res.json()["id"]
        print(f"[STAGE 8] Dispatched field technician: {worker_user['full_name']} (Assignment ID: {assignment_id})", flush=True)

        # STAGE 9 & 10: Field worker views task and updates to IN_PROGRESS
        worker_login = await client.post("/api/auth/login", json={
            "email": worker_user["email"],
            "password": "worker123"
        })
        assert worker_login.status_code == 200
        token_worker = worker_login.json()["access_token"]
        headers_worker = {"Authorization": f"Bearer {token_worker}"}

        update_task = await client.patch(f"/api/assignments/{assignment_id}/status", headers=headers_worker, json={
            "status": "IN_PROGRESS",
            "notes": "Work crew arrived on site with compaction roller."
        })
        assert update_task.status_code == 200
        print("[STAGE 9 & 10] Field worker accepted assignment and set status to IN_PROGRESS.", flush=True)

        # STAGE 11: Worker uploads repair evidence photograph
        ev_res = await client.post("/api/evidence/upload", headers=headers_worker, json={
            "issue_group_id": issue_group_id,
            "evidence_type": "AFTER_REPAIR",
            "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=600&q=80",
            "remarks": "Pothole filled with dense bituminous macadam and compacted with roller."
        })
        assert ev_res.status_code == 200
        evidence_id = ev_res.json()["id"]
        print(f"[STAGE 11] Worker uploaded repair evidence photo (Evidence ID: {evidence_id}).", flush=True)

        # Verify mandatory requirement: issue is PENDING_VERIFICATION, NOT resolved yet
        check_iss = (await client.get(f"/api/issues/{issue_group_id}")).json()
        assert check_iss["status"] == "PENDING_VERIFICATION"
        print("[Mandatory Check] Issue is in PENDING_VERIFICATION. Worker cannot mark RESOLVED alone!", flush=True)

        # STAGE 12 & 13: Administrator reviews evidence and certifies RESOLVED
        certify_res = await client.post(f"/api/evidence/{evidence_id}/verify", headers=headers_admin, json={
            "is_verified": True,
            "remarks": "Visual inspection of asphalt compaction confirmed by Ward Engineer."
        })
        assert certify_res.status_code == 200

        resolved_iss = (await client.get(f"/api/issues/{issue_group_id}")).json()
        assert resolved_iss["status"] == "RESOLVED"
        assert resolved_iss["resolved_at"] is not None
        print(f"[STAGE 12 & 13] Administrator verified evidence photograph. Status officially certified: RESOLVED!", flush=True)

        # STAGE 14: Both citizens receive status updates
        notifs_a = (await client.get("/api/notifications", headers=headers_a)).json()
        assert len(notifs_a) > 0
        notifs_b = (await client.get("/api/notifications", headers=headers_b)).json()
        assert len(notifs_b) > 0
        print("[STAGE 14] Both Citizen A and Citizen B verified as having received municipal notifications.", flush=True)

        # STAGE 15: Citizen feedback submission
        feedback_res = await client.post("/api/feedback", headers=headers_a, json={
            "issue_group_id": issue_group_id,
            "rating": 5,
            "comments": "Superb resolution! Road is completely smooth and safe again.",
            "request_reopen": False
        })
        assert feedback_res.status_code == 200
        print("[STAGE 15] Citizen A submitted 5-Star feedback with community appreciation.", flush=True)

        # Final verification: Analytics reflects resolved metrics
        analytics_res = await client.get("/api/admin/analytics", headers=headers_admin)
        assert analytics_res.status_code == 200
        summary = analytics_res.json()["summary"]
        print(f"\n[Analytics Certified] Total Complaints: {summary['total_complaints']}, Resolved: {summary['resolved_complaints']}, Avg SLA: {summary['avg_resolution_hours']}h", flush=True)

    print("\n=======================================================", flush=True)
    print("   ALL 15 HACKATHON WORKFLOW STAGES PASSED (100% SUCCESS)!", flush=True)
    print("=======================================================\n", flush=True)

if __name__ == "__main__":
    asyncio.run(run_full_workflow_test())
