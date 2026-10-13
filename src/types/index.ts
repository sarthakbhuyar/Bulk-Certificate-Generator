export type JobStatus = 'queued' | 'processing' | 'completed' | 'partially_completed' | 'failed';

export type RecipientStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface RecipientInput {
  name: string;
  email: string;
  score?: string;
  completion_id?: string;
  custom_note?: string;
}

export interface RecipientRecord extends RecipientInput {
  id: string;
  status: RecipientStatus;
  certificate_id?: string;
  verification_hash?: string;
  error_message?: string;
  processed_at?: string;
}

export interface CertificateTemplateConfig {
  id: string;
  name: string;
  theme: 'royal_gold' | 'executive_navy' | 'academic_emerald' | 'modern_tech';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
}

export interface CertificateJobRequest {
  event_name: string;
  organization_name: string;
  issue_date: string;
  signatory_name: string;
  signatory_title: string;
  template_theme?: 'royal_gold' | 'executive_navy' | 'academic_emerald' | 'modern_tech';
  description?: string;
  recipients: RecipientInput[];
  async_processing?: boolean;
}

export interface CertificateJob {
  id: string;
  event_name: string;
  organization_name: string;
  issue_date: string;
  signatory_name: string;
  signatory_title: string;
  template_theme: 'royal_gold' | 'executive_navy' | 'academic_emerald' | 'modern_tech';
  description?: string;
  status: JobStatus;
  total_recipients: number;
  processed_count: number;
  success_count: number;
  failure_count: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  recipients: RecipientRecord[];
}

export interface CertificateMetadata {
  certificate_id: string;
  verification_hash: string;
  recipient_name: string;
  recipient_email: string;
  event_name: string;
  organization_name: string;
  issue_date: string;
  signatory_name: string;
  signatory_title: string;
  score?: string;
  job_id: string;
  issued_at: string;
  template_theme: 'royal_gold' | 'executive_navy' | 'academic_emerald' | 'modern_tech';
  svg_content: string;
}

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  duration_ms: number;
  details: string;
  response_data?: any;
}

export interface TestSuiteReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration_ms: number;
    timestamp: string;
  };
  results: TestResultItem[];
}
