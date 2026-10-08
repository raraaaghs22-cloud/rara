import os
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env')

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else "https://vibesmai.preview.emergentagent.com"
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'raraaaghs22@gmail.com').lower()

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def db():
    return _db


@pytest.fixture(scope="session")
def admin_session(db):
    """Create admin user + session, delete at end."""
    # Ensure settings admin record exists for ADMIN_EMAIL (don't overwrite)
    existing_admin = db.settings.find_one({"key": "admin"})
    if not existing_admin:
        db.settings.insert_one({"key": "admin", "email": ADMIN_EMAIL})
    user = db.users.find_one({"email": ADMIN_EMAIL})
    created_user = False
    if not user:
        user_id = f"user_test_{uuid.uuid4().hex[:10]}"
        db.users.insert_one({"user_id": user_id, "email": ADMIN_EMAIL,
                             "name": "Test Admin", "picture": None,
                             "created_at": datetime.now(timezone.utc).isoformat()})
        created_user = True
    else:
        user_id = user["user_id"]
    token = f"test_session_{uuid.uuid4().hex}"
    db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    yield {"token": token, "user_id": user_id, "email": ADMIN_EMAIL}
    db.user_sessions.delete_one({"session_token": token})
    if created_user:
        db.users.delete_one({"user_id": user_id})


@pytest.fixture(scope="session")
def nonadmin_session(db):
    email = f"test.user.{uuid.uuid4().hex[:8]}@example.com"
    user_id = f"user_test_{uuid.uuid4().hex[:10]}"
    db.users.insert_one({"user_id": user_id, "email": email,
                         "name": "Test NonAdmin", "created_at": datetime.now(timezone.utc).isoformat()})
    token = f"test_session_{uuid.uuid4().hex}"
    db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    yield {"token": token, "user_id": user_id, "email": email}
    db.user_sessions.delete_one({"session_token": token})
    db.users.delete_one({"user_id": user_id})


@pytest.fixture
def admin_client(admin_session):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {admin_session['token']}",
                      "Content-Type": "application/json"})
    return s


@pytest.fixture
def nonadmin_client(nonadmin_session):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {nonadmin_session['token']}",
                      "Content-Type": "application/json"})
    return s


@pytest.fixture
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_submissions(db):
    yield
    # Cleanup: delete all TEST_ submissions and restore results_public=false
    db.submissions.delete_many({"full_name": {"$regex": "^TEST_"}})
    db.settings.update_one({"key": "results_public"}, {"$set": {"value": False}}, upsert=True)
