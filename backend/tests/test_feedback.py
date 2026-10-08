"""Backend tests for 'Komentar AI Siswa' student_feedback feature."""
import time
import uuid
import pytest


FORBIDDEN = ["AI", "metadata", "privasi", "privacy", "sistem"]


def _seed(db, **kw):
    sid = str(uuid.uuid4())
    base = {
        "id": sid, "full_name": "TEST_FB Dinda Putri", "class_name": "XI 4",
        "attendance_number": 15, "video_link": "https://youtu.be/abc",
        "platform": "youtube", "status": "draft",
        "ai_score": 85, "ai_letter_grade": "B",
        "ai_strengths": "Penjelasan fungsi musik hiburan jelas dengan contoh konser lokal.",
        "ai_weaknesses": "Belum ada subtitle dan tagar #FungsiMusik, tambahkan juga mention @Mr. Ocha.",
        "content_score": 85, "delivery_score": 85, "technical_score": 85,
        "final_score": 85.0, "final_grade": "B", "manually_edited": False,
        "teacher_notes": "", "student_feedback": "",
        "created_at": "2026-01-02T00:00:00+00:00",
    }
    base.update(kw)
    db.submissions.insert_one(base)
    return sid


def _first_name(full):
    return full.split()[0] if full else ""


# ---------- POST /api/admin/submissions/{id}/feedback ----------
class TestFeedbackEndpoint:
    def test_unauth_401(self, anon_client, base_url, db):
        sid = _seed(db, full_name="TEST_FB Auth One")
        r = anon_client.post(f"{base_url}/api/admin/submissions/{sid}/feedback", json={})
        assert r.status_code == 401

    def test_nonadmin_403(self, nonadmin_client, base_url, db):
        sid = _seed(db, full_name="TEST_FB Auth Two")
        r = nonadmin_client.post(f"{base_url}/api/admin/submissions/{sid}/feedback", json={})
        assert r.status_code == 403

    def test_unknown_id_404(self, admin_client, base_url):
        r = admin_client.post(f"{base_url}/api/admin/submissions/doesnotexist/feedback", json={})
        assert r.status_code == 404

    @pytest.mark.slow
    def test_feedback_generated_mentions_first_name(self, admin_client, base_url, db):
        # First name must be literally first word of full_name per prompt; avoid TEST_ prefix.
        sid = _seed(db, full_name="Dinda Anggraini TEST_FBSUFFIX", class_name="XI 2", attendance_number=5)
        try:
            r = admin_client.post(f"{base_url}/api/admin/submissions/{sid}/feedback", json={})
            assert r.status_code == 200, r.text
            text = r.json().get("student_feedback", "")
            assert isinstance(text, str) and len(text.strip()) >= 20
            # Should greet with the first name early in the message
            assert "Dinda" in text[:80], f"First name missing: {text!r}"
            # Should not mention metadata/privacy per prompt
            low = text.lower()
            for word in ("metadata", "privasi"):
                assert word not in low, f"Forbidden word '{word}' in feedback: {text!r}"
            # Persisted
            rec = db.submissions.find_one({"id": sid})
            assert rec["student_feedback"] == text
            assert rec.get("feedback_generated_at")
        finally:
            db.submissions.delete_one({"id": sid})

    @pytest.mark.slow
    def test_feedback_privacy_failed_no_video_details(self, admin_client, base_url, db):
        """When extraction failed (privacy), feedback must NOT invent video details or mention privacy/AI."""
        sid = _seed(db, full_name="Rina Marlina TEST_FBPRIV", class_name="XI 5", attendance_number=22,
                    extraction_ok=False,
                    ai_input="Data gagal diekstrak karena privasi link.",
                    ai_score=0, ai_letter_grade="D", final_score=0.0, final_grade="D",
                    ai_strengths="-",
                    ai_weaknesses="Sistem tidak dapat membaca konten karena privasi. Silakan nilai secara manual")
        try:
            r = admin_client.post(f"{base_url}/api/admin/submissions/{sid}/feedback", json={})
            assert r.status_code == 200, r.text
            text = r.json()["student_feedback"]
            assert "Rina" in text[:80]
            low = text.lower()
            for word in ("privasi", "privacy", "metadata"):
                assert word not in low, f"Should not mention '{word}': {text!r}"
        finally:
            db.submissions.delete_one({"id": sid})


# ---------- PATCH auto-feedback on finalize ----------
class TestPatchAutoFeedback:
    @pytest.mark.slow
    def test_patch_final_auto_generates_feedback(self, admin_client, base_url, db):
        sid = _seed(db, full_name="Budi Santoso TEST_FBAUTO", class_name="XI 6", attendance_number=8,
                    student_feedback="", final_score=None, final_grade=None)
        try:
            r = admin_client.patch(f"{base_url}/api/admin/submissions/{sid}",
                                   json={"final_score": 85, "status": "final"})
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["status"] == "final"
            fb = d.get("student_feedback") or ""
            assert len(fb.strip()) >= 20, f"Feedback empty on finalize: {d!r}"
            assert "Budi" in fb[:80]
            rec = db.submissions.find_one({"id": sid})
            assert rec["student_feedback"] == fb
            assert rec.get("feedback_generated_at")
        finally:
            db.submissions.delete_one({"id": sid})

    @pytest.mark.slow
    def test_patch_final_custom_feedback_preserved(self, admin_client, base_url, db):
        sid = _seed(db, full_name="TEST_Keep Custom", class_name="XI 7", attendance_number=9,
                    student_feedback="", manually_edited=False)
        custom = "Halo Keep, kerja bagus di penjelasan fungsi musik. Lain kali tambahkan tagar #FungsiMusik ya."
        r = admin_client.patch(f"{base_url}/api/admin/submissions/{sid}",
                               json={"status": "final", "student_feedback": custom})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["student_feedback"] == custom, "Custom feedback was overwritten"
        # Per spec: student_feedback alone should NOT set manually_edited
        assert d["manually_edited"] is False, "manually_edited should not be set by student_feedback alone"


# ---------- Bulk finalize triggers background feedback ----------
class TestBulkFinalFeedback:
    @pytest.mark.slow
    def test_bulk_final_generates_feedback_bg(self, admin_client, base_url, db):
        # Use full_name with TEST_ prefix for cleanup; just assert feedback was generated (non-empty, >= 20 chars).
        ids = [
            _seed(db, full_name=f"TEST_Anto Pratama{i}", class_name="XI 10",
                  attendance_number=30 + i, final_score=82.0, final_grade="B",
                  student_feedback="")
            for i in range(2)
        ]
        r = admin_client.post(f"{base_url}/api/admin/bulk-status",
                              json={"ids": ids, "status": "final"})
        assert r.status_code == 200
        assert r.json()["updated"] == 2
        deadline = time.time() + 40
        pending = set(ids)
        while time.time() < deadline and pending:
            for sid in list(pending):
                rec = db.submissions.find_one({"id": sid})
                if (rec.get("student_feedback") or "").strip():
                    pending.discard(sid)
            if pending:
                time.sleep(3)
        assert not pending, f"Background feedback never generated for {pending}"
        for sid in ids:
            rec = db.submissions.find_one({"id": sid})
            fb = rec.get("student_feedback") or ""
            assert len(fb.strip()) >= 20, f"Feedback too short: {fb!r}"


# ---------- Public results exposure ----------
class TestPublicResultsFeedback:
    def test_public_results_feedback_final_only(self, admin_client, anon_client, base_url, db):
        _seed(db, full_name="TEST_FB Pub Final Siti", class_name="XI 11", attendance_number=18,
              status="final", final_score=90.0, final_grade="A",
              student_feedback="Halo Siti, komentar guru yang baik.")
        _seed(db, full_name="TEST_FB Pub Draft Doni", class_name="XI 11", attendance_number=19,
              status="draft", final_score=70.0, final_grade="C",
              student_feedback="Komentar draft yang seharusnya tidak muncul.")
        try:
            admin_client.put(f"{base_url}/api/admin/settings", json={"results_public": True})
            r1 = anon_client.get(f"{base_url}/api/public/results",
                                 params={"class_name": "XI 11", "attendance_number": 18})
            assert r1.status_code == 200
            final = next(x for x in r1.json() if x["full_name"] == "TEST_FB Pub Final Siti")
            assert final["is_final"] is True
            assert final["student_feedback"] == "Halo Siti, komentar guru yang baik."

            r2 = anon_client.get(f"{base_url}/api/public/results",
                                 params={"class_name": "XI 11", "attendance_number": 19})
            assert r2.status_code == 200
            draft = next(x for x in r2.json() if x["full_name"] == "TEST_FB Pub Draft Doni")
            assert draft["is_final"] is False
            assert draft["student_feedback"] is None
        finally:
            admin_client.put(f"{base_url}/api/admin/settings", json={"results_public": False})


# ---------- Export CSV column ----------
class TestExportFeedbackColumn:
    def test_csv_contains_komentar_column(self, admin_client, base_url, db):
        _seed(db, full_name="TEST_FB CSV Row", class_name="XI 1", attendance_number=1,
              status="final", student_feedback="Halo CSV, teruskan semangatnya!")
        r = admin_client.get(f"{base_url}/api/admin/export", params={"format": "csv"})
        assert r.status_code == 200
        text = r.text
        assert "Komentar untuk Siswa" in text, "Header column missing"
        assert "Halo CSV, teruskan semangatnya!" in text, "Student feedback value missing"
