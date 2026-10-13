"""FastAPI application for Bulk Certificate Generation system."""

import uuid
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db, SessionLocal
from models import JobModel, RecipientModel, CertificateModel
from schemas import (
    JobCreateRequest,
    JobResponse,
    JobListResponse,
    CertificateDetailResponse,
    VerificationResponse,
)
from services import process_bulk_generation_job

# Initialize relational database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CertiBatch - Bulk Certificate Generator API",
    description="High-throughput bulk certificate generation backend with fault-tolerant individual failure handling, background workers, and verification.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_worker_task(job_id: str):
    """Background task runner providing its own isolated DB session."""
    db = SessionLocal()
    try:
        process_bulk_generation_job(job_id, db)
    finally:
        db.close()


import os

HTML_FILE_PATH = os.path.join(os.path.dirname(__file__), "index.html")


@app.get("/", response_class=HTMLResponse, tags=["Home"])
def home_dashboard():
    """Returns the complete interactive Generator Studio & Preview UI at the root URL."""
    if os.path.exists(HTML_FILE_PATH):
        with open(HTML_FILE_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>CertiBatch API is Running</h1>"


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "CertiBatch API", "version": "1.0.0"}


@app.post(
    "/api/v1/jobs",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit Bulk Certificate Generation Job",
    tags=["Jobs"],
)
def create_job(
    payload: JobCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Submits a batch certificate generation request for multiple recipients.
    Validates payload and queues the job for background execution.
    """
    job_id = f"job_{uuid.uuid4().hex[:10]}"

    new_job = JobModel(
        id=job_id,
        event_name=payload.event_name,
        organization_name=payload.organization_name,
        issue_date=payload.issue_date,
        signatory_name=payload.signatory_name,
        signatory_title=payload.signatory_title or "Authorized Signatory",
        template_theme=payload.template_theme or "royal_gold",
        description=payload.description,
        status="queued",
        total_recipients=len(payload.recipients),
        processed_count=0,
        success_count=0,
        failure_count=0,
        progress_percentage=0,
    )
    db.add(new_job)

    # Insert recipient rows
    for idx, rec in enumerate(payload.recipients):
        rec_model = RecipientModel(
            id=f"rec_{job_id}_{idx+1}",
            job_id=job_id,
            name=rec.name,
            email=rec.email,
            score=rec.score,
            custom_note=rec.custom_note,
            status="pending",
        )
        db.add(rec_model)

    db.commit()
    db.refresh(new_job)

    if payload.async_processing:
        background_tasks.add_task(run_worker_task, job_id)
    else:
        # Synchronous mode for testing/immediate responses
        process_bulk_generation_job(job_id, db)
        db.refresh(new_job)

    return new_job


@app.post(
    "/api/v1/certificates/generate",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Alias: Submit Certificate Generation Request",
    tags=["Jobs"],
)
def generate_certificates_alias(
    payload: JobCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Direct alias matching the prompt specification."""
    return create_job(payload, background_tasks, db)


@app.get("/api/v1/jobs", response_model=JobListResponse, summary="List Generation Jobs", tags=["Jobs"])
def list_jobs(db: Session = Depends(get_db)):
    """Retrieves all past and active certificate generation jobs."""
    jobs = db.query(JobModel).order_by(JobModel.created_at.desc()).all()
    return JobListResponse(total_jobs=len(jobs), jobs=jobs)


@app.get("/api/v1/jobs/{job_id}", response_model=JobResponse, summary="Get Job Status and Progress", tags=["Jobs"])
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """
    Checks the status and progress of a certificate generation job.
    Returns counts for total, processed, succeeded, failed, and itemized results.
    """
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID '{job_id}' not found")
    return job


@app.get(
    "/api/v1/certificates/{certificate_id}",
    response_model=CertificateDetailResponse,
    summary="Retrieve Generated Certificate",
    tags=["Certificates"],
)
def get_certificate(certificate_id: str, db: Session = Depends(get_db)):
    """Retrieves a specific generated certificate and its vector SVG content."""
    cert = db.query(CertificateModel).filter(CertificateModel.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail=f"Certificate '{certificate_id}' not found")

    return CertificateDetailResponse(
        certificate_id=cert.certificate_id,
        verification_hash=cert.verification_hash,
        recipient_name=cert.recipient_name,
        recipient_email=cert.recipient_email,
        event_name=cert.event_name,
        organization_name=cert.organization_name,
        issue_date=cert.issue_date,
        signatory_name=cert.signatory_name,
        signatory_title=cert.signatory_title,
        score=cert.score,
        job_id=cert.job_id,
        issued_at=cert.created_at,
        svg_content=cert.svg_content,
    )


@app.get(
    "/api/v1/certificates/{certificate_id}/download",
    summary="Download Certificate SVG",
    tags=["Certificates"],
)
def download_certificate(certificate_id: str, db: Session = Depends(get_db)):
    """Directly downloads the certificate as an SVG vector file."""
    cert = db.query(CertificateModel).filter(CertificateModel.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail=f"Certificate '{certificate_id}' not found")

    return Response(
        content=cert.svg_content,
        media_type="image/svg+xml",
        headers={"Content-Disposition": f'attachment; filename="certificate_{cert.certificate_id}.svg"'},
    )


@app.get(
    "/api/v1/certificates/verify/{token}",
    response_model=VerificationResponse,
    summary="Public Certificate Verification",
    tags=["Verification"],
)
def verify_certificate(token: str, db: Session = Depends(get_db)):
    """
    Public authenticity verification endpoint.
    Validates either the unique Certificate ID or the SHA-256 verification token.
    """
    clean_token = token.strip().upper()
    cert = (
        db.query(CertificateModel)
        .filter(
            (CertificateModel.verification_hash == clean_token)
            | (CertificateModel.certificate_id == clean_token)
        )
        .first()
    )

    if not cert:
        return VerificationResponse(
            verified=False,
            message="No authentic certificate matching this token was found.",
            certificate=None,
        )

    return VerificationResponse(
        verified=True,
        message="Valid and authentic certificate verified.",
        certificate={
            "certificate_id": cert.certificate_id,
            "verification_hash": cert.verification_hash,
            "recipient_name": cert.recipient_name,
            "event_name": cert.event_name,
            "organization_name": cert.organization_name,
            "issue_date": cert.issue_date,
            "signatory_name": cert.signatory_name,
            "signatory_title": cert.signatory_title,
            "score": cert.score,
            "issued_at": cert.created_at.isoformat(),
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
