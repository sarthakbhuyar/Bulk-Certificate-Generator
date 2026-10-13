"""Core business logic for certificate generation and background worker processing."""

import hashlib
import uuid
from datetime import datetime, timezone
import html
from sqlalchemy.orm import Session
from models import JobModel, RecipientModel, CertificateModel


def utc_now():
    return datetime.now(timezone.utc)


THEME_COLORS = {
    "royal_gold": {
        "paper_bg": "#fffdfa",
        "inner_border": "#d4af37",
        "outer_border": "#b38f28",
        "title_color": "#854d0e",
        "name_color": "#0f172a",
        "seal_1": "#fef08a",
        "seal_2": "#eab308",
        "seal_3": "#a16207",
    },
    "executive_navy": {
        "paper_bg": "#f8fafc",
        "inner_border": "#1e3a8a",
        "outer_border": "#3b82f6",
        "title_color": "#1e3a8a",
        "name_color": "#0f172a",
        "seal_1": "#93c5fd",
        "seal_2": "#3b82f6",
        "seal_3": "#1d4ed8",
    },
    "academic_emerald": {
        "paper_bg": "#fbfdfb",
        "inner_border": "#065f46",
        "outer_border": "#047857",
        "title_color": "#065f46",
        "name_color": "#022c22",
        "seal_1": "#6ee7b7",
        "seal_2": "#10b981",
        "seal_3": "#047857",
    },
    "modern_tech": {
        "paper_bg": "#fafafa",
        "inner_border": "#6366f1",
        "outer_border": "#8b5cf6",
        "title_color": "#4f46e5",
        "name_color": "#09090b",
        "seal_1": "#c4b5fd",
        "seal_2": "#8b5cf6",
        "seal_3": "#6d28d9",
    },
}


def generate_verification_hash(cert_id: str, email: str, org_name: str) -> str:
    """Generates a tamper-proof SHA-256 verification hash token."""
    raw = f"{cert_id}:{email}:{org_name}:{utc_now().isoformat()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16].upper()


def render_certificate_svg(
    certificate_id: str,
    verification_hash: str,
    recipient_name: str,
    event_name: str,
    organization_name: str,
    issue_date: str,
    signatory_name: str,
    signatory_title: str,
    score: str = None,
    theme: str = "royal_gold",
) -> str:
    """Renders a high-resolution vector SVG certificate based on the predefined template."""
    palette = THEME_COLORS.get(theme, THEME_COLORS["royal_gold"])
    clean_name = html.escape(recipient_name)
    clean_org = html.escape(organization_name.upper())
    clean_event = html.escape(event_name)
    clean_signatory = html.escape(signatory_name)
    clean_title = html.escape(signatory_title)
    score_tag = f'<text x="600" y="465" font-family="sans-serif" font-size="15" font-weight="600" fill="#059669" text-anchor="middle">{html.escape(score)}</text>' if score else ''

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="100%" height="100%">
  <defs>
    <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{palette['seal_1']}" />
      <stop offset="50%" stop-color="{palette['seal_2']}" />
      <stop offset="100%" stop-color="{palette['seal_3']}" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{palette['outer_border']}" />
      <stop offset="50%" stop-color="{palette['inner_border']}" />
      <stop offset="100%" stop-color="{palette['outer_border']}" />
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="850" fill="{palette['paper_bg']}" />
  
  <!-- Outer Ornate Borders -->
  <rect x="25" y="25" width="1150" height="800" fill="none" stroke="url(#borderGrad)" stroke-width="4" rx="6" />
  <rect x="35" y="35" width="1130" height="780" fill="none" stroke="{palette['inner_border']}" stroke-width="1.5" stroke-dasharray="6,4" />
  <rect x="42" y="42" width="1116" height="766" fill="none" stroke="url(#borderGrad)" stroke-width="2" />

  <!-- Organization Header -->
  <text x="600" y="110" font-family="serif" font-size="20" font-weight="700" letter-spacing="4" fill="{palette['title_color']}" text-anchor="middle">
    {clean_org}
  </text>
  <line x1="450" y1="125" x2="750" y2="125" stroke="{palette['inner_border']}" stroke-width="1.5" />

  <!-- Main Certificate Title -->
  <text x="600" y="180" font-family="serif" font-size="38" font-weight="800" letter-spacing="6" fill="{palette['title_color']}" text-anchor="middle">
    CERTIFICATE OF RECOGNITION
  </text>
  <text x="600" y="222" font-family="sans-serif" font-size="14" font-weight="500" letter-spacing="3" fill="#64748b" text-anchor="middle">
    THIS PRESTIGIOUS CREDENTIAL IS PROUDLY CONFERRED UPON
  </text>

  <!-- Recipient Name -->
  <text x="600" y="305" font-family="Georgia, serif" font-style="italic" font-size="52" font-weight="700" fill="{palette['name_color']}" text-anchor="middle">
    {clean_name}
  </text>
  <path d="M 320 330 Q 600 338 880 330" fill="none" stroke="{palette['inner_border']}" stroke-width="2" />

  <!-- Description -->
  <text x="600" y="375" font-family="sans-serif" font-size="15" font-weight="400" fill="#475569" text-anchor="middle">
    for distinguished participation and fulfillment of all requirements in
  </text>
  <text x="600" y="425" font-family="serif" font-size="26" font-weight="700" fill="{palette['title_color']}" text-anchor="middle">
    {clean_event}
  </text>
  {score_tag}

  <!-- Seal Medallion -->
  <g transform="translate(600, 595)">
    <circle cx="0" cy="0" r="54" fill="url(#sealGrad)" />
    <circle cx="0" cy="0" r="48" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8" />
    <circle cx="0" cy="0" r="44" fill="url(#sealGrad)" />
    <polygon points="0,-22 6,-8 22,-8 10,2 14,18 0,8 -14,18 -10,2 -22,-8 -6,-8" fill="#ffffff" opacity="0.9" />
    <text x="0" y="30" font-family="sans-serif" font-size="8" font-weight="800" letter-spacing="1.5" fill="#78350f" text-anchor="middle">
      VERIFIED • AUTHENTIC
    </text>
  </g>

  <!-- Issue Date -->
  <g transform="translate(180, 610)">
    <line x1="0" y1="40" x2="260" y2="40" stroke="#94a3b8" stroke-width="1.5" />
    <text x="130" y="30" font-family="sans-serif" font-size="14" font-weight="600" fill="#1e293b" text-anchor="middle">
      {html.escape(issue_date)}
    </text>
    <text x="130" y="60" font-family="sans-serif" font-size="11" font-weight="700" letter-spacing="1" fill="#64748b" text-anchor="middle">
      DATE OF ISSUANCE
    </text>
  </g>

  <!-- Signatory -->
  <g transform="translate(760, 610)">
    <line x1="0" y1="40" x2="260" y2="40" stroke="#94a3b8" stroke-width="1.5" />
    <text x="130" y="58" font-family="serif" font-size="15" font-weight="700" fill="#0f172a" text-anchor="middle">
      {clean_signatory}
    </text>
    <text x="130" y="74" font-family="sans-serif" font-size="11" font-weight="500" fill="#64748b" text-anchor="middle">
      {clean_title}
    </text>
  </g>

  <!-- Security Badges -->
  <g transform="translate(80, 755)">
    <text x="0" y="0" font-family="monospace" font-size="10" font-weight="600" fill="#475569">
      CERTIFICATE ID: <tspan fill="#0f172a" font-weight="700">{certificate_id}</tspan>
    </text>
    <text x="0" y="14" font-family="monospace" font-size="9" font-weight="500" fill="#64748b">
      VERIFICATION HASH: <tspan fill="#2563eb">{verification_hash}</tspan>
    </text>
  </g>
</svg>"""


def process_bulk_generation_job(job_id: str, db: Session):
    """
    Executes bulk certificate generation for a job.
    Adheres strictly to the requirement:
    'A failure while generating one certificate should not unnecessarily prevent
     other valid certificates in the same job from being generated.'
    """
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        return

    job.status = "processing"
    job.updated_at = utc_now()
    db.commit()

    recipients = db.query(RecipientModel).filter(RecipientModel.job_id == job_id).all()

    for rec in recipients:
        rec.status = "processing"
        db.commit()

        try:
            # Individual validation rule enforcement
            if not rec.name or len(rec.name.strip()) < 2:
                raise ValueError("Recipient name must be at least 2 characters")
            
            if "@" not in rec.email or "." not in rec.email.split("@")[-1]:
                raise ValueError(f"Invalid recipient email format: '{rec.email}'")

            # Generation of credentials
            year = utc_now().year
            short_id = uuid.uuid4().hex[:6].upper()
            cert_id = f"CERT-{year}-{short_id}"
            v_hash = generate_verification_hash(cert_id, rec.email, job.organization_name)

            svg_data = render_certificate_svg(
                certificate_id=cert_id,
                verification_hash=v_hash,
                recipient_name=rec.name,
                event_name=job.event_name,
                organization_name=job.organization_name,
                issue_date=job.issue_date,
                signatory_name=job.signatory_name,
                signatory_title=job.signatory_title,
                score=rec.score,
                theme=job.template_theme,
            )

            cert = CertificateModel(
                certificate_id=cert_id,
                job_id=job.id,
                recipient_id=rec.id,
                verification_hash=v_hash,
                recipient_name=rec.name,
                recipient_email=rec.email,
                event_name=job.event_name,
                organization_name=job.organization_name,
                issue_date=job.issue_date,
                signatory_name=job.signatory_name,
                signatory_title=job.signatory_title,
                score=rec.score,
                svg_content=svg_data,
                created_at=utc_now(),
            )
            db.add(cert)

            rec.status = "success"
            rec.certificate_id = cert_id
            rec.verification_hash = v_hash
            rec.processed_at = utc_now()
            job.success_count += 1

        except Exception as e:
            # Isolated error handling: records the specific recipient failure without aborting the batch
            rec.status = "failed"
            rec.error_message = str(e)
            rec.processed_at = utc_now()
            job.failure_count += 1

        job.processed_count += 1
        job.progress_percentage = int((job.processed_count / job.total_recipients) * 100)
        job.updated_at = utc_now()
        db.commit()

    # Determine final state of job
    if job.failure_count == 0:
        job.status = "completed"
    elif job.success_count > 0:
        job.status = "partially_completed"
    else:
        job.status = "failed"

    job.completed_at = utc_now()
    job.updated_at = utc_now()
    db.commit()
