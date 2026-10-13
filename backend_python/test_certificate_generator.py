"""
Automated Integration & Unit Test Suite for Bulk Certificate Generator.

Tests cover:
1. Creating a generation job
2. Input validation (Rejecting empty titles, bad formatting)
3. Certificate generation & vector SVG validity
4. Job status and progress tracking
5. Handling an individual certificate failure (Fault-tolerance & error isolation)
6. Retrieving generated certificates & public verification
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import main
from database import Base, get_db
from main import app
from services import render_certificate_svg, generate_verification_hash

# StaticPool ensures all SQLite connections in memory share the exact same database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Patch main.SessionLocal so background worker tasks share the test database
main.SessionLocal = TestingSessionLocal


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Recreate clean tables before each test case on the shared StaticPool."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_1_create_generation_job():
    """Test creating a valid bulk certificate generation job."""
    payload = {
        "event_name": "Full-Stack Development Bootcamp",
        "organization_name": "CodeForge Academy",
        "issue_date": "2026-10-13",
        "signatory_name": "Prof. Alan Turing",
        "signatory_title": "Head of Computing",
        "template_theme": "royal_gold",
        "recipients": [
            {"name": "Alice Johnson", "email": "alice@example.com", "score": "95%"},
            {"name": "Bob Smith", "email": "bob@example.com", "score": "88%"},
        ],
        "async_processing": False,  # Run synchronously to evaluate final state immediately
    }

    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 202
    data = response.json()

    assert data["id"].startswith("job_")
    assert data["status"] == "completed"
    assert data["total_recipients"] == 2
    assert data["success_count"] == 2
    assert data["failure_count"] == 0
    assert len(data["recipients"]) == 2
    assert data["recipients"][0]["status"] == "success"
    assert data["recipients"][0]["certificate_id"] is not None


def test_2_input_validation():
    """Test that invalid job and recipient structures are appropriately rejected."""
    # 1. Missing required field 'event_name'
    bad_job_payload = {
        "organization_name": "Acme Inc",
        "issue_date": "2026-10-13",
        "signatory_name": "Jane Doe",
        "recipients": [{"name": "Charlie", "email": "charlie@example.com"}],
    }
    resp = client.post("/api/v1/jobs", json=bad_job_payload)
    assert resp.status_code == 422  # Pydantic validation error

    # 2. Empty recipients list
    empty_recipients_payload = {
        "event_name": "Math Olympiad",
        "organization_name": "Acme Inc",
        "issue_date": "2026-10-13",
        "signatory_name": "Jane Doe",
        "recipients": [],
    }
    resp2 = client.post("/api/v1/jobs", json=empty_recipients_payload)
    assert resp2.status_code == 422

    # 3. Invalid email address format
    bad_email_payload = {
        "event_name": "Math Olympiad",
        "organization_name": "Acme Inc",
        "issue_date": "2026-10-13",
        "signatory_name": "Jane Doe",
        "recipients": [{"name": "Charlie", "email": "not_an_email_address"}],
    }
    resp3 = client.post("/api/v1/jobs", json=bad_email_payload)
    assert resp3.status_code == 422


def test_3_certificate_generation():
    """Test deterministic SVG vector rendering and security hash generation."""
    cert_id = "CERT-2026-TEST01"
    v_hash = generate_verification_hash(cert_id, "test@test.com", "Test Org")

    svg = render_certificate_svg(
        certificate_id=cert_id,
        verification_hash=v_hash,
        recipient_name="Grace Hopper",
        event_name="Advanced Compiler Optimization",
        organization_name="Institute of Computer Science",
        issue_date="October 2026",
        signatory_name="John von Neumann",
        signatory_title="Chair of Computation",
        score="100% (Distinction)",
        theme="academic_emerald",
    )

    assert svg.startswith("<svg")
    assert "Grace Hopper" in svg
    assert "Advanced Compiler Optimization" in svg
    assert cert_id in svg
    assert v_hash in svg
    assert "100% (Distinction)" in svg


def test_4_job_status_and_progress():
    """Test retrieving job status, progress percentage, and timestamps."""
    payload = {
        "event_name": "Data Engineering Workshop",
        "organization_name": "DataCamp",
        "issue_date": "2026-10-13",
        "signatory_name": "Dr. Sarah",
        "recipients": [
            {"name": "Dev One", "email": "dev1@test.com"},
            {"name": "Dev Two", "email": "dev2@test.com"},
        ],
        "async_processing": False,
    }

    create_resp = client.post("/api/v1/jobs", json=payload)
    job_id = create_resp.json()["id"]

    # Poll status endpoint
    status_resp = client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    job_data = status_resp.json()

    assert job_data["id"] == job_id
    assert job_data["progress_percentage"] == 100
    assert job_data["processed_count"] == 2
    assert job_data["status"] == "completed"


def test_5_handling_individual_certificate_failure():
    """
    CRITICAL REQUIREMENT TEST:
    A failure while generating one certificate should NOT unnecessarily
    prevent other valid certificates in the same job from being generated.
    """
    # Note: We test the worker's resilient execution against bad data records
    from services import process_bulk_generation_job
    from models import JobModel, RecipientModel

    db = TestingSessionLocal()
    job_id = "job_fault_test_01"
    job = JobModel(
        id=job_id,
        event_name="Fault Resilience Test",
        organization_name="Resilience Corp",
        issue_date="2026-10-13",
        signatory_name="Auditor",
        signatory_title="Lead Auditor",
        status="queued",
        total_recipients=3,
    )
    db.add(job)

    # 1 Valid, 1 with bad email format, 1 Valid
    rec1 = RecipientModel(id="r1", job_id=job_id, name="Valid User 1", email="valid1@test.com", status="pending")
    rec2 = RecipientModel(id="r2", job_id=job_id, name="X", email="invalid-email-address", status="pending") # Corrupt
    rec3 = RecipientModel(id="r3", job_id=job_id, name="Valid User 2", email="valid2@test.com", status="pending")
    db.add_all([rec1, rec2, rec3])
    db.commit()

    # Process job through the worker engine
    process_bulk_generation_job(job_id, db)

    # Reload job
    db.refresh(job)
    assert job.status == "partially_completed"
    assert job.total_recipients == 3
    assert job.processed_count == 3
    assert job.success_count == 2
    assert job.failure_count == 1

    # Check recipient statuses
    r1 = db.query(RecipientModel).filter_by(id="r1").first()
    r2 = db.query(RecipientModel).filter_by(id="r2").first()
    r3 = db.query(RecipientModel).filter_by(id="r3").first()

    assert r1.status == "success"
    assert r1.certificate_id is not None

    assert r2.status == "failed"
    assert r2.error_message is not None  # Failure isolated with clear error description

    assert r3.status == "success"
    assert r3.certificate_id is not None
    db.close()


def test_6_retrieving_generated_certificates_and_verification():
    """Test retrieving individual certificates by ID, downloading SVG, and verifying token."""
    payload = {
        "event_name": "Cybersecurity Specialist",
        "organization_name": "Defense Academy",
        "issue_date": "2026-10-13",
        "signatory_name": "Gen. Hacker",
        "recipients": [{"name": "Neo Anderson", "email": "neo@matrix.org", "score": "Top 1%"}],
        "async_processing": False,
    }

    job_resp = client.post("/api/v1/jobs", json=payload)
    cert_id = job_resp.json()["recipients"][0]["certificate_id"]
    verification_hash = job_resp.json()["recipients"][0]["verification_hash"]

    # 1. Retrieve certificate metadata & content
    get_cert_resp = client.get(f"/api/v1/certificates/{cert_id}")
    assert get_cert_resp.status_code == 200
    cert_data = get_cert_resp.json()
    assert cert_data["certificate_id"] == cert_id
    assert cert_data["recipient_name"] == "Neo Anderson"
    assert "<svg" in cert_data["svg_content"]

    # 2. Download endpoint
    download_resp = client.get(f"/api/v1/certificates/{cert_id}/download")
    assert download_resp.status_code == 200
    assert "image/svg+xml" in download_resp.headers["content-type"]
    assert "attachment" in download_resp.headers["content-disposition"]

    # 3. Public verification by verification hash
    verify_resp = client.get(f"/api/v1/certificates/verify/{verification_hash}")
    assert verify_resp.status_code == 200
    assert verify_resp.json()["verified"] is True
    assert verify_resp.json()["certificate"]["recipient_name"] == "Neo Anderson"

    # 4. Unknown verification token returns verified: False
    unknown_resp = client.get("/api/v1/certificates/verify/FAKE_HASH_000000000")
    assert unknown_resp.json()["verified"] is False
