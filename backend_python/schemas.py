"""Pydantic schemas for data validation and API serialization."""

from datetime import datetime
from typing import List, Optional
import re
from pydantic import BaseModel, Field, field_validator, ConfigDict


EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class RecipientCreate(BaseModel):
    """Input payload for a single recipient."""
    name: str = Field(..., description="Recipient full name")
    email: str = Field(..., description="Recipient email address")
    score: Optional[str] = Field(None, description="Optional grade, score or honors")
    custom_note: Optional[str] = Field(None, description="Optional custom remark")

    @field_validator("name")
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Recipient name cannot be empty")
        if len(trimmed) < 2:
            raise ValueError("Recipient name must be at least 2 characters")
        if len(trimmed) > 100:
            raise ValueError("Recipient name exceeds 100 characters")
        return trimmed

    @field_validator("email")
    def validate_email(cls, v: str) -> str:
        trimmed = v.strip()
        if not EMAIL_REGEX.match(trimmed):
            raise ValueError(f"Invalid email address format: '{trimmed}'")
        return trimmed


class JobCreateRequest(BaseModel):
    """Payload to initiate bulk certificate generation."""
    event_name: str = Field(..., min_length=2, max_length=200, description="Title of course/event")
    organization_name: str = Field(..., min_length=2, max_length=200, description="Issuing organization")
    issue_date: str = Field(..., min_length=2, max_length=50, description="Date of issuance")
    signatory_name: str = Field(..., min_length=2, max_length=100, description="Signer full name")
    signatory_title: Optional[str] = Field("Authorized Signatory", max_length=100)
    template_theme: Optional[str] = Field("royal_gold", description="royal_gold, executive_navy, academic_emerald, modern_tech")
    description: Optional[str] = None
    recipients: List[RecipientCreate] = Field(..., min_length=1, description="List of recipients")
    async_processing: Optional[bool] = Field(True, description="Process in background task queue")


class RecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    score: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    certificate_id: Optional[str] = None
    verification_hash: Optional[str] = None
    processed_at: Optional[datetime] = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_name: str
    organization_name: str
    issue_date: str
    signatory_name: str
    signatory_title: str
    template_theme: str
    description: Optional[str] = None
    status: str
    total_recipients: int
    processed_count: int
    success_count: int
    failure_count: int
    progress_percentage: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    recipients: List[RecipientResponse] = []


class JobSummaryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_name: str
    organization_name: str
    issue_date: str
    status: str
    total_recipients: int
    processed_count: int
    success_count: int
    failure_count: int
    progress_percentage: int
    created_at: datetime
    completed_at: Optional[datetime] = None


class JobListResponse(BaseModel):
    total_jobs: int
    jobs: List[JobSummaryItem]


class CertificateDetailResponse(BaseModel):
    certificate_id: str
    verification_hash: str
    recipient_name: str
    recipient_email: str
    event_name: str
    organization_name: str
    issue_date: str
    signatory_name: str
    signatory_title: str
    score: Optional[str] = None
    job_id: str
    issued_at: datetime
    svg_content: str


class VerificationResponse(BaseModel):
    verified: bool
    message: str
    certificate: Optional[dict] = None
