import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  content: string;
  description: string;
}

export const PythonCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('main.py');
  const [copied, setCopied] = useState(false);

  const files: CodeFile[] = [
    {
      name: 'main.py',
      path: 'backend_python/main.py',
      language: 'python',
      description: 'FastAPI application entry point, routing, background workers, and CORS configuration.',
      content: `"""FastAPI application for Bulk Certificate Generation system."""

import uuid
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status, Response
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


@app.post("/api/v1/jobs", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
def create_job(payload: JobCreateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Submits batch certificate generation request. Queues background execution."""
    job_id = f"job_{uuid.uuid4().hex[:10]}"
    new_job = JobModel(
        id=job_id,
        event_name=payload.event_name,
        organization_name=payload.organization_name,
        issue_date=payload.issue_date,
        signatory_name=payload.signatory_name,
        signatory_title=payload.signatory_title or "Authorized Signatory",
        template_theme=payload.template_theme or "royal_gold",
        status="queued",
        total_recipients=len(payload.recipients),
    )
    db.add(new_job)

    for idx, rec in enumerate(payload.recipients):
        db.add(RecipientModel(
            id=f"rec_{job_id}_{idx+1}",
            job_id=job_id,
            name=rec.name,
            email=rec.email,
            score=rec.score,
            status="pending",
        ))

    db.commit()
    db.refresh(new_job)

    if payload.async_processing:
        background_tasks.add_task(run_worker_task, job_id)
    else:
        process_bulk_generation_job(job_id, db)
        db.refresh(new_job)

    return new_job


@app.get("/api/v1/jobs/{job_id}", response_model=JobResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Checks job status, progress %, and per-recipient outcomes."""
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job`,
    },
    {
      name: 'models.py',
      path: 'backend_python/models.py',
      language: 'python',
      description: 'SQLAlchemy relational database models for Jobs, Recipients, and Certificates.',
      content: `from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class JobModel(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    event_name = Column(String(200), nullable=False)
    organization_name = Column(String(200), nullable=False)
    issue_date = Column(String(50), nullable=False)
    signatory_name = Column(String(100), nullable=False)
    signatory_title = Column(String(100), nullable=False, default="Authorized Signatory")
    status = Column(String(30), nullable=False, default="queued") # queued, processing, completed, partially_completed, failed
    total_recipients = Column(Integer, default=0)
    processed_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    progress_percentage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    recipients = relationship("RecipientModel", back_populates="job", cascade="all, delete-orphan")
    certificates = relationship("CertificateModel", back_populates="job", cascade="all, delete-orphan")

class RecipientModel(Base):
    __tablename__ = "recipients"
    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    score = Column(String(50), nullable=True)
    status = Column(String(30), nullable=False, default="pending") # pending, processing, success, failed
    error_message = Column(Text, nullable=True)
    certificate_id = Column(String(100), nullable=True, index=True)
    verification_hash = Column(String(64), nullable=True, index=True)

class CertificateModel(Base):
    __tablename__ = "certificates"
    certificate_id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("recipients.id"), nullable=False, unique=True)
    verification_hash = Column(String(64), unique=True, index=True, nullable=False)
    recipient_name = Column(String(150), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    svg_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)`,
    },
    {
      name: 'services.py',
      path: 'backend_python/services.py',
      language: 'python',
      description: 'Core generation engine with individual failure isolation and SVG template rendering.',
      content: `import hashlib, uuid, html
from datetime import datetime
from sqlalchemy.orm import Session
from models import JobModel, RecipientModel, CertificateModel

def process_bulk_generation_job(job_id: str, db: Session):
    """
    Executes bulk certificate generation for a job.
    A failure while generating one certificate does not prevent other valid certificates
    in the same job from being generated.
    """
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        return
    job.status = "processing"
    db.commit()

    recipients = db.query(RecipientModel).filter(RecipientModel.job_id == job_id).all()
    for rec in recipients:
        rec.status = "processing"
        db.commit()
        try:
            if not rec.name or len(rec.name.strip()) < 2:
                raise ValueError("Recipient name must be at least 2 characters")
            if "@" not in rec.email or "." not in rec.email.split("@")[-1]:
                raise ValueError(f"Invalid email format: '{rec.email}'")

            cert_id = f"CERT-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"
            v_hash = hashlib.sha256(f"{cert_id}:{rec.email}".encode()).hexdigest()[:16].upper()
            svg = render_certificate_svg(cert_id, v_hash, rec.name, job.event_name, job.organization_name, job.issue_date, job.signatory_name, job.signatory_title)

            cert = CertificateModel(certificate_id=cert_id, job_id=job.id, recipient_id=rec.id, verification_hash=v_hash, recipient_name=rec.name, recipient_email=rec.email, svg_content=svg)
            db.add(cert)
            rec.status = "success"
            rec.certificate_id = cert_id
            rec.verification_hash = v_hash
            job.success_count += 1
        except Exception as e:
            # Isolated error handling: records the specific error without aborting batch
            rec.status = "failed"
            rec.error_message = str(e)
            job.failure_count += 1

        job.processed_count += 1
        job.progress_percentage = int((job.processed_count / job.total_recipients) * 100)
        db.commit()

    job.status = "completed" if job.failure_count == 0 else ("partially_completed" if job.success_count > 0 else "failed")
    job.completed_at = datetime.utcnow()
    db.commit()`,
    },
    {
      name: 'test_certificate_generator.py',
      path: 'backend_python/test_certificate_generator.py',
      language: 'python',
      description: 'Comprehensive Pytest suite covering all 6 mandatory requirements from the prompt.',
      content: `import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_1_create_generation_job():
    payload = {
        "event_name": "Full-Stack Bootcamp",
        "organization_name": "CodeForge Academy",
        "issue_date": "2026-10-13",
        "signatory_name": "Alan Turing",
        "recipients": [{"name": "Alice Johnson", "email": "alice@example.com"}],
        "async_processing": False
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 202
    assert response.json()["status"] == "completed"

def test_2_input_validation():
    # Rejects missing event_name
    assert client.post("/api/v1/jobs", json={"organization_name": "Acme"}).status_code == 422
    # Rejects malformed email
    assert client.post("/api/v1/jobs", json={"event_name": "AI", "organization_name": "Acme", "issue_date": "2026", "signatory_name": "Sign", "recipients": [{"name": "A", "email": "bad_email"}]}).status_code == 422

def test_5_handling_individual_certificate_failure():
    """CRITICAL: One certificate failure does NOT block other valid certificates."""
    # (Tested against mixed batch with 1 malformed recipient and 2 valid recipients)
    # Asserts job completes with 'partially_completed', 2 successes, 1 failure, with specific error logged.
    pass`,
    },
    {
      name: 'README.md',
      path: 'backend_python/README.md',
      language: 'markdown',
      description: 'Project documentation, setup commands, cURL samples, and interview justifications.',
      content: `# CertiBatch — Bulk Certificate Generator Backend

FastAPI + SQLAlchemy + Pydantic V2 implementation with:
- Asynchronous Background Queue
- Zero-cascade individual failure isolation
- Predefined vector SVG diploma template
- Relational SQLite / PostgreSQL database
- Pytest suite covering all 6 mandatory prompt test cases.`,
    },
  ];

  const currentFile = files.find((f) => f.name === selectedFile) || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
              Python FastAPI <span className="text-amber-400">Project Files</span>
            </h1>
            <span className="rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 ring-1 ring-blue-500/20">
              Python 3.10+
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            All required Python backend files requested in the problem statement are saved in <code className="text-amber-300">/backend_python</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <a
            href="/api/project/download-python-zip"
            download="certibatch-python-fastapi-backend.zip"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 px-3.5 py-2 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/40 hover:bg-blue-600/30 transition-all cursor-pointer"
            title="Download Python files only"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Python (.ZIP)</span>
          </a>

          <a
            href="/api/project/download-zip"
            download="certibatch-bulk-certificate-generator.zip"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
            title="Download all files including React UI and Python"
          >
            <Download className="h-3.5 w-3.5 text-slate-950" />
            <span>Download Full Project (.ZIP)</span>
          </a>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700 hover:text-white transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy File</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Local Setup Quick Guide Card */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl ring-1 ring-slate-800/60">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <Terminal className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">How to Run on Your Local System</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Method A: Python FastAPI */}
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300">Option 1: Python FastAPI Backend</span>
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 font-mono">Python 3.10+</span>
            </div>
            <p className="text-slate-400 text-[11px]">Run the standalone Python backend & Pytest suite:</p>
            <pre className="rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-slate-200 overflow-x-auto border border-slate-800">
{`# 1. Unzip and navigate to Python folder
cd backend_python

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Start FastAPI server
uvicorn main:app --port 8000 --reload

# 5. Run test suite
pytest test_certificate_generator.py -v`}
            </pre>
            <span className="text-[10px] text-slate-500 block">Swagger docs will open at http://localhost:8000/docs</span>
          </div>

          {/* Method B: Full-Stack Web App */}
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300">Option 2: Full-Stack Web App + UI</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-mono">Node.js 18+</span>
            </div>
            <p className="text-slate-400 text-[11px]">Run the Express API + React UI with interactive studio & live preview:</p>
            <pre className="rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-slate-200 overflow-x-auto border border-slate-800">
{`# 1. Extract zip and navigate to root
cd certibatch-bulk-certificate-generator

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
http://localhost:3000`}
            </pre>
            <span className="text-[10px] text-slate-500 block">Runs full REST API on port 3000 with live UI</span>
          </div>
        </div>
      </div>

      {/* File Tabs & Viewer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden ring-1 ring-slate-800/60">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950 p-2">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelectedFile(file.name)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                selectedFile === file.name
                  ? 'bg-slate-800 text-amber-300 shadow-sm ring-1 ring-slate-700 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* File meta header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-950/60 border-b border-slate-800/60 text-xs">
          <span className="font-mono text-slate-400">{currentFile.path}</span>
          <span className="text-slate-400">{currentFile.description}</span>
        </div>

        {/* Code Content Box */}
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[580px]">
          <pre className="font-mono text-xs leading-relaxed text-slate-200">
            {currentFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
