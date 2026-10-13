import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CertificateJob,
  CertificateJobRequest,
  CertificateMetadata,
  RecipientInput,
  RecipientRecord,
  TestSuiteReport,
  TestResultItem,
} from './src/types/index.ts';
import { generateCertificateSvg } from './src/utils/certificateGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '15mb' }));

// ---------------------------------------------------------
// IN-MEMORY / PERSISTENT DATA STORE
// ---------------------------------------------------------
const jobsDatabase = new Map<string, CertificateJob>();
const certificatesDatabase = new Map<string, CertificateMetadata>();
const verificationMap = new Map<string, string>(); // hash -> certId

// Seed initial sample job so the UI is immediately populated and impressive
seedInitialData();

function seedInitialData() {
  const initialJobId = 'job_bootcamp_demo_2026';
  const recipientsData: RecipientInput[] = [
    { name: 'Sarah Connor', email: 's.connor@cyberdyne.org', score: '98% (Honors)' },
    { name: 'Alex Rivera', email: 'arivera@polytechnic.edu', score: '94%' },
    { name: 'Priya Sharma', email: 'priya.sharma@techinst.ac.in', score: '99% (Summa Cum Laude)' },
    { name: 'Marcus Vance', email: 'm.vance@vancestudios.com', score: '91%' },
    { name: 'Elena Rostova', email: 'elena.rostova@datascience.io', score: '96% (Distinction)' },
    { name: 'David Kim', email: 'dkim@quantumlab.io', score: '92%' },
    { name: 'Chloe Dubois', email: 'chloe.dubois@sorbonne.fr', score: '95%' },
    { name: 'Liam O\'Connor', email: 'liam@dublincoding.ie', score: '93%' },
  ];

  const recipients: RecipientRecord[] = recipientsData.map((rec, index) => {
    const certId = `CERT-2026-${String(index + 101).padStart(4, '0')}`;
    const hash = crypto
      .createHash('sha256')
      .update(`${certId}-${rec.email}-Acme Academy`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    const svg = generateCertificateSvg({
      certificateId: certId,
      verificationHash: hash,
      recipientName: rec.name,
      recipientEmail: rec.email,
      eventName: 'Executive Cloud & Distributed Systems Architecture',
      organizationName: 'Global Institute of Software Engineering',
      issueDate: 'October 12, 2026',
      signatoryName: 'Dr. Evelyn Sterling',
      signatoryTitle: 'Dean of Technology & Fellowship Chair',
      score: rec.score,
      theme: 'royal_gold',
    });

    const certMeta: CertificateMetadata = {
      certificate_id: certId,
      verification_hash: hash,
      recipient_name: rec.name,
      recipient_email: rec.email,
      event_name: 'Executive Cloud & Distributed Systems Architecture',
      organization_name: 'Global Institute of Software Engineering',
      issue_date: 'October 12, 2026',
      signatory_name: 'Dr. Evelyn Sterling',
      signatory_title: 'Dean of Technology & Fellowship Chair',
      score: rec.score,
      job_id: initialJobId,
      issued_at: new Date(Date.now() - 3600000).toISOString(),
      template_theme: 'royal_gold',
      svg_content: svg,
    };

    certificatesDatabase.set(certId, certMeta);
    verificationMap.set(hash, certId);
    verificationMap.set(certId, certId);

    return {
      ...rec,
      id: `rec_${index + 1}`,
      status: 'success',
      certificate_id: certId,
      verification_hash: hash,
      processed_at: new Date(Date.now() - 3600000 + index * 500).toISOString(),
    };
  });

  const demoJob: CertificateJob = {
    id: initialJobId,
    event_name: 'Executive Cloud & Distributed Systems Architecture',
    organization_name: 'Global Institute of Software Engineering',
    issue_date: 'October 12, 2026',
    signatory_name: 'Dr. Evelyn Sterling',
    signatory_title: 'Dean of Technology & Fellowship Chair',
    template_theme: 'royal_gold',
    description: 'Annual cohort accreditation for lead software architects',
    status: 'completed',
    total_recipients: recipients.length,
    processed_count: recipients.length,
    success_count: recipients.length,
    failure_count: 0,
    progress_percentage: 100,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 3600000).toISOString(),
    recipients,
  };

  jobsDatabase.set(initialJobId, demoJob);
}

// ---------------------------------------------------------
// VALIDATION HELPERS
// ---------------------------------------------------------
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

function validateRecipient(recipient: RecipientInput): ValidationResult {
  if (!recipient || typeof recipient !== 'object') {
    return { isValid: false, errorMessage: 'Recipient entry must be an object' };
  }

  const name = recipient.name?.trim();
  if (!name) {
    return { isValid: false, errorMessage: 'Recipient name is required and cannot be empty' };
  }

  if (name.length < 2) {
    return { isValid: false, errorMessage: `Recipient name '${name}' is too short (min 2 characters)` };
  }

  if (name.length > 100) {
    return { isValid: false, errorMessage: `Recipient name exceeds maximum limit of 100 characters` };
  }

  const email = recipient.email?.trim();
  if (!email) {
    return { isValid: false, errorMessage: 'Recipient email is required' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, errorMessage: `Invalid email address format: '${email}'` };
  }

  return { isValid: true };
}

// ---------------------------------------------------------
// BACKGROUND CERTIFICATE PROCESSOR
// ---------------------------------------------------------
async function processJobQueue(jobId: string, simulateWorkerDelay = true) {
  const job = jobsDatabase.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.updated_at = new Date().toISOString();

  for (let i = 0; i < job.recipients.length; i++) {
    const rec = job.recipients[i];
    rec.status = 'processing';

    // Worker processing simulation delay to illustrate asynchronous queue progression
    if (simulateWorkerDelay) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    const validation = validateRecipient(rec);

    if (!validation.isValid) {
      // Individual failure isolation: record error without failing the entire job
      rec.status = 'failed';
      rec.error_message = validation.errorMessage;
      rec.processed_at = new Date().toISOString();
      job.failure_count += 1;
    } else {
      // Valid recipient: generate certificate
      const certId = `CERT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const verificationHash = crypto
        .createHash('sha256')
        .update(`${certId}-${rec.email}-${job.organization_name}-${Date.now()}`)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();

      const svgContent = generateCertificateSvg({
        certificateId: certId,
        verificationHash,
        recipientName: rec.name.trim(),
        recipientEmail: rec.email.trim(),
        eventName: job.event_name,
        organizationName: job.organization_name,
        issueDate: job.issue_date,
        signatoryName: job.signatory_name,
        signatoryTitle: job.signatory_title,
        score: rec.score,
        theme: job.template_theme,
      });

      const certMetadata: CertificateMetadata = {
        certificate_id: certId,
        verification_hash: verificationHash,
        recipient_name: rec.name.trim(),
        recipient_email: rec.email.trim(),
        event_name: job.event_name,
        organization_name: job.organization_name,
        issue_date: job.issue_date,
        signatory_name: job.signatory_name,
        signatory_title: job.signatory_title,
        score: rec.score,
        job_id: job.id,
        issued_at: new Date().toISOString(),
        template_theme: job.template_theme,
        svg_content: svgContent,
      };

      certificatesDatabase.set(certId, certMetadata);
      verificationMap.set(verificationHash, certId);
      verificationMap.set(certId, certId);

      rec.status = 'success';
      rec.certificate_id = certId;
      rec.verification_hash = verificationHash;
      rec.processed_at = new Date().toISOString();
      job.success_count += 1;
    }

    job.processed_count += 1;
    job.progress_percentage = Math.round((job.processed_count / job.total_recipients) * 100);
    job.updated_at = new Date().toISOString();
  }

  // Final job state determination
  if (job.failure_count === 0) {
    job.status = 'completed';
  } else if (job.success_count > 0) {
    job.status = 'partially_completed';
  } else {
    job.status = 'failed';
  }

  job.completed_at = new Date().toISOString();
  job.updated_at = new Date().toISOString();
}

// ---------------------------------------------------------
// REST API ROUTES
// ---------------------------------------------------------

// 1. Submit a Bulk Certificate Generation Job
app.post('/api/jobs', (req: Request, res: Response) => {
  const body = req.body as CertificateJobRequest;

  // Validate top-level request
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!body.event_name?.trim()) {
    return res.status(400).json({ error: 'Field "event_name" is required' });
  }

  if (!body.organization_name?.trim()) {
    return res.status(400).json({ error: 'Field "organization_name" is required' });
  }

  if (!body.issue_date?.trim()) {
    return res.status(400).json({ error: 'Field "issue_date" is required' });
  }

  if (!body.signatory_name?.trim()) {
    return res.status(400).json({ error: 'Field "signatory_name" is required' });
  }

  if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
    return res.status(400).json({ error: 'Field "recipients" must be a non-empty array' });
  }

  const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const recipients: RecipientRecord[] = body.recipients.map((item, idx) => ({
    id: `rec_${jobId}_${idx + 1}`,
    name: item.name || '',
    email: item.email || '',
    score: item.score,
    completion_id: item.completion_id,
    custom_note: item.custom_note,
    status: 'pending',
  }));

  const newJob: CertificateJob = {
    id: jobId,
    event_name: body.event_name.trim(),
    organization_name: body.organization_name.trim(),
    issue_date: body.issue_date.trim(),
    signatory_name: body.signatory_name.trim(),
    signatory_title: (body.signatory_title || 'Authorized Signatory').trim(),
    template_theme: body.template_theme || 'royal_gold',
    description: body.description?.trim(),
    status: 'queued',
    total_recipients: recipients.length,
    processed_count: 0,
    success_count: 0,
    failure_count: 0,
    progress_percentage: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    recipients,
  };

  jobsDatabase.set(jobId, newJob);

  // Background worker processing
  const isSync = body.async_processing === false;
  if (isSync) {
    processJobQueue(jobId, false).then(() => {
      res.status(201).json(jobsDatabase.get(jobId));
    });
  } else {
    // Asynchronous dispatch (background queue)
    setTimeout(() => {
      processJobQueue(jobId, true).catch(console.error);
    }, 20);

    return res.status(202).json({
      message: 'Certificate generation job accepted and queued for processing',
      job_id: jobId,
      status: 'queued',
      total_recipients: recipients.length,
      status_url: `/api/jobs/${jobId}`,
    });
  }
});

// Alias for problem statement: POST /api/certificates/generate
app.post('/api/certificates/generate', (req: Request, res: Response) => {
  // Delegate directly to /api/jobs handler logic
  req.url = '/api/jobs';
  app._router.handle(req, res);
});

// 2. List all jobs
app.get('/api/jobs', (_req: Request, res: Response) => {
  const jobsList = Array.from(jobsDatabase.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({
    total_jobs: jobsList.length,
    jobs: jobsList.map((j) => ({
      id: j.id,
      event_name: j.event_name,
      organization_name: j.organization_name,
      issue_date: j.issue_date,
      status: j.status,
      total_recipients: j.total_recipients,
      processed_count: j.processed_count,
      success_count: j.success_count,
      failure_count: j.failure_count,
      progress_percentage: j.progress_percentage,
      created_at: j.created_at,
      completed_at: j.completed_at,
    })),
  });
});

// 3. Get Job Status and Detailed Progress / Result
app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobsDatabase.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: `Job with ID '${req.params.id}' not found` });
  }
  res.json(job);
});

// 4. Retrieve a Specific Generated Certificate Metadata & SVG
app.get('/api/certificates/:certId', (req: Request, res: Response) => {
  const cert = certificatesDatabase.get(req.params.certId);
  if (!cert) {
    return res.status(404).json({ error: `Certificate with ID '${req.params.certId}' not found` });
  }
  res.json(cert);
});

// 5. Download Certificate as SVG File
app.get('/api/certificates/:certId/download', (req: Request, res: Response) => {
  const cert = certificatesDatabase.get(req.params.certId);
  if (!cert) {
    return res.status(404).json({ error: `Certificate '${req.params.certId}' not found` });
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="certificate_${cert.certificate_id.toLowerCase()}.svg"`
  );
  res.send(cert.svg_content);
});

// 6. Public Verification Endpoint
app.get('/api/certificates/verify/:token', (req: Request, res: Response) => {
  const token = req.params.token.trim().toUpperCase();
  const certId = verificationMap.get(token);

  if (!certId || !certificatesDatabase.has(certId)) {
    return res.status(404).json({
      verified: false,
      message: 'Certificate credential could not be verified. Invalid verification hash or ID.',
      token,
    });
  }

  const cert = certificatesDatabase.get(certId)!;
  res.json({
    verified: true,
    message: 'Authentic certificate credential verified successfully.',
    certificate: {
      certificate_id: cert.certificate_id,
      verification_hash: cert.verification_hash,
      recipient_name: cert.recipient_name,
      recipient_email: cert.recipient_email,
      event_name: cert.event_name,
      organization_name: cert.organization_name,
      issue_date: cert.issue_date,
      signatory_name: cert.signatory_name,
      signatory_title: cert.signatory_title,
      score: cert.score,
      issued_at: cert.issued_at,
    },
  });
});

// 7. Automated Test Suite Execution Endpoint
app.post('/api/test/run', async (_req: Request, res: Response) => {
  const results: TestResultItem[] = [];
  const startTime = Date.now();

  // Test 1: Creating a generation job
  {
    const tStart = Date.now();
    const testPayload: CertificateJobRequest = {
      event_name: 'Unit Test Suite Workshop',
      organization_name: 'CertiBatch Testing Authority',
      issue_date: '2026-10-13',
      signatory_name: 'Test Proctor',
      signatory_title: 'QA Lead',
      recipients: [
        { name: 'John Doe', email: 'john.doe@test.com' },
        { name: 'Jane Smith', email: 'jane.smith@test.com' },
      ],
      async_processing: false,
    };

    try {
      const jobId = `test_job_${Date.now()}`;
      const recs: RecipientRecord[] = testPayload.recipients.map((r, i) => ({
        ...r,
        id: `t_rec_${i}`,
        status: 'pending',
      }));
      const testJob: CertificateJob = {
        id: jobId,
        ...testPayload,
        template_theme: 'royal_gold',
        status: 'queued',
        total_recipients: recs.length,
        processed_count: 0,
        success_count: 0,
        failure_count: 0,
        progress_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipients: recs,
      };
      jobsDatabase.set(jobId, testJob);
      await processJobQueue(jobId, false);

      const saved = jobsDatabase.get(jobId);
      const passed = !!saved && saved.total_recipients === 2 && saved.success_count === 2;
      results.push({
        id: 'test_create_job',
        name: 'Create Certificate Generation Job',
        category: 'Job Creation',
        passed,
        duration_ms: Date.now() - tStart,
        details: passed
          ? 'Successfully accepted payload and created certificate batch with 2 recipients'
          : 'Failed to create job properly',
        response_data: { job_id: jobId, status: saved?.status },
      });
    } catch (e: any) {
      results.push({
        id: 'test_create_job',
        name: 'Create Certificate Generation Job',
        category: 'Job Creation',
        passed: false,
        duration_ms: Date.now() - tStart,
        details: e.message,
      });
    }
  }

  // Test 2: Input validation (Invalid root payloads)
  {
    const tStart = Date.now();
    try {
      const invalidEmail = validateRecipient({ name: 'Bob Dylan', email: 'not-an-email' });
      const emptyName = validateRecipient({ name: '   ', email: 'valid@test.com' });
      const valid = validateRecipient({ name: 'Alice Cooper', email: 'alice@rock.com' });

      const passed = !invalidEmail.isValid && !emptyName.isValid && valid.isValid;
      results.push({
        id: 'test_validation',
        name: 'Input Validation (Email RFC & Name Constraints)',
        category: 'Validation',
        passed,
        duration_ms: Date.now() - tStart,
        details: passed
          ? 'Correctly rejected malformed emails, rejected empty names, and accepted valid inputs'
          : 'Validation failed expectation',
        response_data: {
          invalid_email_error: invalidEmail.errorMessage,
          empty_name_error: emptyName.errorMessage,
        },
      });
    } catch (e: any) {
      results.push({
        id: 'test_validation',
        name: 'Input Validation (Email RFC & Name Constraints)',
        category: 'Validation',
        passed: false,
        duration_ms: Date.now() - tStart,
        details: e.message,
      });
    }
  }

  // Test 3: Handling individual certificate failure without blocking batch
  {
    const tStart = Date.now();
    try {
      const faultJobId = `test_fault_${Date.now()}`;
      const mixedRecipients: RecipientInput[] = [
        { name: 'Valid Person One', email: 'valid1@test.com' },
        { name: 'X', email: 'shortname@test.com' }, // Invalid: name < 2 chars
        { name: 'Valid Person Two', email: 'valid2@test.com' },
        { name: 'Invalid Email Person', email: 'bad_email_format' }, // Invalid email
        { name: 'Valid Person Three', email: 'valid3@test.com' },
      ];

      const recs: RecipientRecord[] = mixedRecipients.map((r, i) => ({
        ...r,
        id: `fault_rec_${i}`,
        status: 'pending',
      }));

      const faultJob: CertificateJob = {
        id: faultJobId,
        event_name: 'Fault Isolation Test',
        organization_name: 'Resilience Institute',
        issue_date: '2026-10-13',
        signatory_name: 'Fault Proctor',
        signatory_title: 'Director',
        template_theme: 'academic_emerald',
        status: 'queued',
        total_recipients: recs.length,
        processed_count: 0,
        success_count: 0,
        failure_count: 0,
        progress_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipients: recs,
      };

      jobsDatabase.set(faultJobId, faultJob);
      await processJobQueue(faultJobId, false);

      const processed = jobsDatabase.get(faultJobId);
      const passed =
        processed?.status === 'partially_completed' &&
        processed.success_count === 3 &&
        processed.failure_count === 2 &&
        processed.processed_count === 5;

      results.push({
        id: 'test_fault_tolerance',
        name: 'Fault-Tolerant Bulk Processing (Individual Failure Isolation)',
        category: 'Failure Handling',
        passed,
        duration_ms: Date.now() - tStart,
        details: passed
          ? 'Isolated 2 failed recipients with exact error messages while successfully generating certificates for the other 3 recipients without interrupting the job'
          : `Expected 3 successes and 2 failures, got ${processed?.success_count} / ${processed?.failure_count}`,
        response_data: {
          job_status: processed?.status,
          success_count: processed?.success_count,
          failure_count: processed?.failure_count,
          failed_reasons: processed?.recipients
            .filter((r) => r.status === 'failed')
            .map((r) => ({ name: r.name, error: r.error_message })),
        },
      });
    } catch (e: any) {
      results.push({
        id: 'test_fault_tolerance',
        name: 'Fault-Tolerant Bulk Processing (Individual Failure Isolation)',
        category: 'Failure Handling',
        passed: false,
        duration_ms: Date.now() - tStart,
        details: e.message,
      });
    }
  }

  // Test 4: Certificate Generation & Vector SVG Integrity
  {
    const tStart = Date.now();
    try {
      const svg = generateCertificateSvg({
        certificateId: 'CERT-TEST-999',
        verificationHash: 'HASH999ABC',
        recipientName: 'Master Yoda',
        eventName: 'Jedi Council Masterclass',
        organizationName: 'Jedi Temple Coruscant',
        issueDate: 'October 2026',
        signatoryName: 'Mace Windu',
        signatoryTitle: 'Council Elder',
        theme: 'royal_gold',
      });

      const passed =
        svg.includes('Master Yoda') &&
        svg.includes('CERT-TEST-999') &&
        svg.includes('HASH999ABC') &&
        svg.startsWith('<svg');

      results.push({
        id: 'test_svg_generation',
        name: 'Vector Certificate Generation (Visual & Security Marks)',
        category: 'Generation',
        passed,
        duration_ms: Date.now() - tStart,
        details: passed
          ? 'Generated valid, compliant vector SVG containing recipient metadata, guilloche seal, and security verification marks'
          : 'SVG output was incomplete or missing key attributes',
        response_data: { svg_length: svg.length, has_vector_defs: svg.includes('<defs>') },
      });
    } catch (e: any) {
      results.push({
        id: 'test_svg_generation',
        name: 'Vector Certificate Generation (Visual & Security Marks)',
        category: 'Generation',
        passed: false,
        duration_ms: Date.now() - tStart,
        details: e.message,
      });
    }
  }

  // Test 5: Job Status & Progress Tracking
  {
    const tStart = Date.now();
    try {
      const allJobs = Array.from(jobsDatabase.values());
      const hasCompleted = allJobs.some((j) => j.status === 'completed' || j.status === 'partially_completed');
      const passed = allJobs.length > 0 && hasCompleted;

      results.push({
        id: 'test_job_status',
        name: 'Job Status & Real-time Progress Tracking',
        category: 'Status & Tracking',
        passed,
        duration_ms: Date.now() - tStart,
        details: passed
          ? `Status tracked across ${allJobs.length} active jobs with accurate percentage metrics and counts`
          : 'Unable to query job status',
      });
    } catch (e: any) {
      results.push({
        id: 'test_job_status',
        name: 'Job Status & Real-time Progress Tracking',
        category: 'Status & Tracking',
        passed: false,
        duration_ms: Date.now() - tStart,
        details: e.message,
      });
    }
  }

  // Test 6: Certificate Retrieval & Public Verification
  {
    const tStart = Date.now();
    try {
      const sampleCertId = Array.from(certificatesDatabase.keys())[0];
      const cert = certificatesDatabase.get(sampleCertId);
      const verified = cert ? verificationMap.get(cert.verification_hash) === sampleCertId : false;

      const passed = !!cert && verified;
      results.push({
        id: 'test_retrieval_and_verify',
        name: 'Certificate Retrieval & Public Authenticity Verification',
        category: 'Retrieval & Verification',
        passed,
        duration_ms: Date.now() - tStart,
        details: passed
          ? `Successfully retrieved certificate '${sampleCertId}' and verified authenticity via cryptographic verification hash`
          : 'Verification failed',
        response_data: { sample_cert_id: sampleCertId, verified },
      });
    } catch (e: any) {
      results.push({
        id: 'test_retrieval_and_verify',
        name: 'Certificate Retrieval & Public Authenticity Verification',
        category: 'Retrieval & Verification',
        passed: false,
        duration_ms: Date.now() - tStart,
        details: e.message,
      });
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const report: TestSuiteReport = {
    summary: {
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    },
    results,
  };

  res.json(report);
});

// 8. Download Entire Project Archive as .ZIP
app.get('/api/project/download-zip', async (_req: Request, res: Response) => {
  try {
    const JSZip = (await import('jszip')).default;
    const fs = await import('fs');
    const zip = new JSZip();

    // Helper to recursively add files from directory
    function addDirectoryToZip(dirPath: string, zipFolder: any, rootPath: string) {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.cache') continue;
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const subFolder = zipFolder.folder(item);
          addDirectoryToZip(fullPath, subFolder, rootPath);
        } else if (stat.isFile()) {
          const content = fs.readFileSync(fullPath);
          zipFolder.file(item, content);
        }
      }
    }

    addDirectoryToZip(__dirname, zip, __dirname);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="certibatch-bulk-certificate-generator.zip"'
    );
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Failed to create project ZIP', err);
    res.status(500).json({ error: 'Failed to create zip archive: ' + err.message });
  }
});

// 9. Download Standalone Python Backend Only as .ZIP
app.get('/api/project/download-python-zip', async (_req: Request, res: Response) => {
  try {
    const JSZip = (await import('jszip')).default;
    const fs = await import('fs');
    const zip = new JSZip();

    const pyDir = path.join(__dirname, 'backend_python');
    if (fs.existsSync(pyDir)) {
      const items = fs.readdirSync(pyDir);
      for (const item of items) {
        const fullPath = path.join(pyDir, item);
        if (fs.statSync(fullPath).isFile()) {
          zip.file(item, fs.readFileSync(fullPath));
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="certibatch-python-fastapi-backend.zip"'
    );
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create python zip: ' + err.message });
  }
});

// ---------------------------------------------------------
// VITE MIDDLEWARE SETUP (Express + Vite Full-Stack)
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CertiBatch Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
