"""Backend tests for 'Komentar AI Siswa' student_feedback feature (ASYNC contract).

New contract (iteration 4):
- POST /api/admin/submissions/{id}/feedback  returns immediately 200 {feedback_status:'generating'}.
- PATCH {final_score, status:'final'} with empty feedback returns quickly with status 'final' and feedback_status='generating'.
- Both resolve to feedback_status='ready' with non-empty student_feedback via GET /api/admin/submissions/{id}.
- Global PriorityLock serialises LLM calls; teacher-priority (POST /feedback / PATCH->final) jumps the queue ahead of background grading.
"""
import time
import uuid
import pytest
import concurrent.futures as cf


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


def _wait_feedback_ready(client, base_url, sid, timeout=90):
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        r = client.get(f"{base_url}/api/admin/submissions/{sid}")
        if r.status_code == 200:
            last = r.json()
            if last.get("feedback_status") == "ready" and (last.get("student_feedback") or "").strip():
                return last
            if last.get("feedback_status") == "failed":
                return last
        time.sleep(2)
    return last


# ---------- POST /api/admin/submissions/{id}/feedback ----------
class TestFeedbackEndpointAuth:
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


class TestFeedbackAsync:
    @pytest.mark.slow
    def test_post_feedback_returns_generating_then_ready(self, admin_client, base_url, db):
        sid = _seed(db, full_name="Dinda Anggraini TEST_FBSUFFIX", class_name="XI 2",
                    attendance_number=5, student_feedback="")
        try:
            t0 = time.time()
            r = admin_client.post(f"{base_url}/api/admin/submissions/{sid}/feedback", json={})
            dt = time.time() - t0
            assert r.status_code == 200, r.text
            assert r.json().get("feedback_status") == "generating"
            assert dt < 5, f"POST /feedback should be async, took {dt:.1f}s"
            rec = _wait_feedback_ready(admin_client, base_url, sid, timeout=90)
            assert rec and rec.get("feedback_status") == "ready", f"Never became ready: {rec}"
            text = rec.get("student_feedback") or ""
            assert len(text.strip()) >= 20, f"Feedback too short: {text!r}"
            assert "Dinda" in text[:80], f"First name missing: {text!r}"
            low = text.lower()
            for word in ("metadata", "privasi"):
                assert word not in low, f"Forbidden word '{word}' in feedback: {text!r}"
            assert rec.get("feedback_generated_at")
        finally:
            db.submissions.delete_one({"id": sid})

    @pytest.mark.slow
    def test_patch_final_async_feedback(self, admin_client, base_url, db):
        sid = _seed(db, full_name="Budi Santoso TEST_FBAUTO", class_name="XI 6",
                    attendance_number=8, student_feedback="", final_score=None, final_grade=None)
        try:
            t0 = time.time()
            r = admin_client.patch(f"{base_url}/api/admin/submissions/{sid}",
                                   json={"final_score": 85, "status": "final"})
            dt = time.time() - t0
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["status"] == "final"
            assert d.get("feedback_status") == "generating", d
            assert dt < 5, f"PATCH->final should be async, took {dt:.1f}s"
            rec = _wait_feedback_ready(admin_client, base_url, sid, timeout=90)
            assert rec and rec.get("feedback_status") == "ready"
            fb = rec.get("student_feedback") or ""
            assert "Budi" in fb[:80]
            assert len(fb.strip()) >= 20
            assert rec.get("feedback_generated_at")
        finally:
            db.submissions.delete_one({"id": sid})

    def test_patch_final_custom_feedback_preserved(self, admin_client, base_url, db):
        sid = _seed(db, full_name="TEST_Keep Custom", class_name="XI 7",
                    attendance_number=9, student_feedback="", manually_edited=False)
        try:
            custom = "Halo Keep, kerja bagus di penjelasan fungsi musik. Lain kali tambahkan tagar #FungsiMusik ya."
            r = admin_client.patch(f"{base_url}/api/admin/submissions/{sid}",
                                   json={"status": "final", "student_feedback": custom})
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["student_feedback"] == custom
            assert d.get("feedback_status") != "generating", d
            assert d["manually_edited"] is False, "manually_edited should not be set by student_feedback alone"
        finally:
            db.submissions.delete_one({"id": sid})

    @pytest.mark.slow
    def test_bulk_final_queues_only_missing(self, admin_client, base_url, db):
        # One with existing feedback (should NOT be re-queued), one empty (should be queued).
        sid_filled = _seed(db, full_name="TEST_FB Bulk Filled", class_name="XI 10",
                           attendance_number=30, final_score=82.0, final_grade="B",
                           student_feedback="Halo kamu, komentar lama yang disimpan.",
                           status="draft")
        sid_empty = _seed(db, full_name="Anto Pratama TEST_FBBULK", class_name="XI 10",
                          attendance_number=31, final_score=82.0, final_grade="B",
                          student_feedback="", status="draft")
        ids = [sid_filled, sid_empty]
        try:
            r = admin_client.post(f"{base_url}/api/admin/bulk-status",
                                  json={"ids": ids, "status": "final"})
            assert r.status_code == 200
            assert r.json()["updated"] == 2
            # Filled one must keep original comment and never enter 'generating'.
            filled = admin_client.get(f"{base_url}/api/admin/submissions/{sid_filled}").json()
            assert filled["student_feedback"] == "Halo kamu, komentar lama yang disimpan."
            # Empty one eventually ready
            rec = _wait_feedback_ready(admin_client, base_url, sid_empty, timeout=90)
            assert rec and rec.get("feedback_status") == "ready"
            assert len((rec.get("student_feedback") or "").strip()) >= 20
            # Filled still unchanged after queue drained
            filled2 = admin_client.get(f"{base_url}/api/admin/submissions/{sid_filled}").json()
            assert filled2["student_feedback"] == "Halo kamu, komentar lama yang disimpan."
        finally:
            for sid in ids:
                db.submissions.delete_one({"id": sid})


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


# ---------- Concurrency + teacher priority ----------
class TestConcurrency:
    @pytest.mark.slow
    def test_parallel_submissions_all_drafted_and_teacher_priority(self, admin_client, anon_client, base_url, db):
        """Fire 4 parallel public submissions; while they grade, a teacher POST /feedback must still return quickly.
        All submissions should reach status 'draft' within ~3 minutes; none 'failed'."""
        link = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        payloads = [
            {"full_name": f"TEST_CC Student {i}", "class_name": "XI 12",
             "attendance_number": 40 + i, "video_link": link}
            for i in range(4)
        ]

        def _post(p):
            s = anon_client
            return s.post(f"{base_url}/api/submissions", json=p)

        with cf.ThreadPoolExecutor(max_workers=4) as ex:
            results = list(ex.map(_post, payloads))
        for r in results:
            assert r.status_code == 200, r.text

        # Find the newly-created ids by name
        time.sleep(1.0)
        docs = list(db.submissions.find({"full_name": {"$regex": "^TEST_CC Student"}}, {"_id": 0, "id": 1, "full_name": 1}))
        assert len(docs) == 4, docs
        ids = [d["id"] for d in docs]

        # While grading is in-flight, teacher POSTs a feedback regen on a seeded record. Must respond fast.
        teacher_sid = _seed(db, full_name="Rara Mentari TEST_CCTEACHER", class_name="XI 2",
                            attendance_number=3, student_feedback="")
        try:
            t0 = time.time()
            r = admin_client.post(f"{base_url}/api/admin/submissions/{teacher_sid}/feedback", json={})
            dt = time.time() - t0
            assert r.status_code == 200, r.text
            assert r.json().get("feedback_status") == "generating"
            assert dt < 5, f"Teacher POST should return immediately, took {dt:.1f}s"
            # Teacher priority: should become ready quickly (before all 4 bg gradings finish)
            trec = _wait_feedback_ready(admin_client, base_url, teacher_sid, timeout=90)
            assert trec and trec.get("feedback_status") == "ready", f"Teacher feedback never ready: {trec}"
            assert len((trec.get("student_feedback") or "").strip()) >= 20
        finally:
            db.submissions.delete_one({"id": teacher_sid})

        # Wait for all 4 submissions to reach draft (none failed) within ~180s.
        deadline = time.time() + 180
        pending = set(ids)
        failed = []
        while time.time() < deadline and pending:
            for sid in list(pending):
                rec = db.submissions.find_one({"id": sid}, {"_id": 0, "status": 1})
                st = (rec or {}).get("status")
                if st == "draft":
                    pending.discard(sid)
                elif st == "failed":
                    failed.append(sid)
                    pending.discard(sid)
            if pending:
                time.sleep(4)
        # Cleanup regardless of outcome
        try:
            assert not failed, f"Some submissions failed: {failed}"
            assert not pending, f"Submissions didn't reach draft in time: {pending}"
        finally:
            db.submissions.delete_many({"id": {"$in": ids}})
