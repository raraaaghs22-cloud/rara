import os
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env')

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') \
    else "https://vibesmai.preview.emergentagent.com"
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'raraaaghs22@gmail.com').lower()

ADMIN_TOKEN = "test_admin_session_vibesmai"
NONADMIN_TOKEN = "test_nonadmin_session_vibesmai"

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def db():
    return _db


def _session(token=None):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture
def admin_client():
    return _session(ADMIN_TOKEN)


@pytest.fixture
def nonadmin_client():
    return _session(NONADMIN_TOKEN)


@pytest.fixture
def anon_client():
    return _session()


@pytest.fixture(scope="session", autouse=True)
def cleanup(db):
    yield
    db.submissions.delete_many({"full_name": {"$regex": "^TEST_"}})
    db.settings.update_one({"key": "results_public"}, {"$set": {"value": False}}, upsert=True)
