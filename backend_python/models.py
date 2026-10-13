"""Relational database models for the Bulk Certificate Generator."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


def utc_now():
    return datetime.now(timezone.utc)


class JobModel(Base):
    """Represents a bulk certificate generation job."""
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    event_name = Column(String(200), nullable=False)
    organization_name = Column(String(200), nullable=False)
    issue_date = Column(String(50), nullable=False)
    signatory_name = Column(String(100), nullable=False)
    signatory_title = Column(String(100), nullable=False, default="Authorized Signatory")
    template_theme = Column(String(50), nullable=False, default="royal_gold")
    description = Column(String(500), nullable=True)

    status = Column(String(30), nullable=False, default="queued")  # queued, processing, completed, partially_completed, failed
    total_recipients = Column(Integer, default=0)
    processed_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    progress_percentage = Column(Integer, default=0)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    completed_at = Column(DateTime, nullable=True)

    recipients = relationship("RecipientModel", back_populates="job", cascade="all, delete-orphan")
    certificates = relationship("CertificateModel", back_populates="job", cascade="all, delete-orphan")


class RecipientModel(Base):
    """Represents a recipient entry within a generation job."""
    __tablename__ = "recipients"

    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    score = Column(String(50), nullable=True)
    custom_note = Column(String(255), nullable=True)

    status = Column(String(30), nullable=False, default="pending")  # pending, processing, success, failed
    error_message = Column(Text, nullable=True)
    certificate_id = Column(String(100), nullable=True, index=True)
    verification_hash = Column(String(64), nullable=True, index=True)
    processed_at = Column(DateTime, nullable=True)

    job = relationship("JobModel", back_populates="recipients")
    certificate = relationship("CertificateModel", back_populates="recipient", uselist=False)


class CertificateModel(Base):
    """Represents an issued tamper-evident certificate."""
    __tablename__ = "certificates"

    certificate_id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    recipient_id = Column(String, ForeignKey("recipients.id"), nullable=False, unique=True)
    verification_hash = Column(String(64), unique=True, index=True, nullable=False)

    recipient_name = Column(String(150), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    event_name = Column(String(200), nullable=False)
    organization_name = Column(String(200), nullable=False)
    issue_date = Column(String(50), nullable=False)
    signatory_name = Column(String(100), nullable=False)
    signatory_title = Column(String(100), nullable=False)
    score = Column(String(50), nullable=True)

    svg_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    job = relationship("JobModel", back_populates="certificates")
    recipient = relationship("RecipientModel", back_populates="certificate")
