import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Send,
  RefreshCw,
  Palette,
  Calendar,
  Building2,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { RecipientInput, CertificateJobRequest } from '../types/index.ts';
import { generateCertificateSvg } from '../utils/certificateGenerator.ts';

interface GeneratorStudioProps {
  onSubmitJob: (request: CertificateJobRequest) => Promise<string | void>;
  onPreviewSample: (svg: string) => void;
  isSubmitting: boolean;
}

const PRESET_BATCHES = [
  {
    id: 'ai_bootcamp',
    label: '🎓 AI Masterclass Cohort',
    badge: '10 Valid Recipients',
    badgeColor: 'emerald',
    eventName: 'Autonomous AI & LLM Systems Engineering',
    orgName: 'Stanford Center for Advanced Computation',
    issueDate: 'October 13, 2026',
    signatoryName: 'Dr. Andrew Ng & Prof. Christopher Manning',
    signatoryTitle: 'Distinguished Research Directors',
    theme: 'royal_gold' as const,
    recipients: [
      { name: 'Katherine Vance', email: 'kvance@stanford.edu', score: '99% (Summa Cum Laude)' },
      { name: 'Liam Takahashi', email: 'liam.t@tokyotech.jp', score: '96% (Distinction)' },
      { name: 'Maria Santos', email: 'msantos@saopaulo.br', score: '94%' },
      { name: 'Chen Wei', email: 'chen.wei@tsinghua.edu.cn', score: '98% (Honors)' },
      { name: 'Amina Al-Mansoor', email: 'amina@emirates-tech.ae', score: '95%' },
      { name: 'Julian Mercer', email: 'jmercer@oxford.ac.uk', score: '92%' },
      { name: 'Zoe Deschanel', email: 'zoe@sorbonne.fr', score: '97% (Distinction)' },
      { name: 'Henrik Lindqvist', email: 'henrik@kth.se', score: '93%' },
      { name: 'Pooja Patel', email: 'pooja.patel@iitb.ac.in', score: '98% (Honors)' },
      { name: 'Lucas Meyer', email: 'lucas.meyer@tum.de', score: '91%' },
    ],
  },
  {
    id: 'fault_test',
    label: '⚠️ Fault-Tolerance Stress Test',
    badge: 'Mixed Valid & Invalid',
    badgeColor: 'amber',
    eventName: 'High-Availability Systems & Resilience Workshop',
    orgName: 'Distributed Reliability Institute',
    issueDate: 'October 13, 2026',
    signatoryName: 'Dr. Leslie Lamport',
    signatoryTitle: 'Chief Systems Architect',
    theme: 'academic_emerald' as const,
    recipients: [
      { name: 'Alice Goodall', email: 'alice.goodall@valid.org', score: '98%' },
      { name: 'Bob Corrupted Email', email: 'bad_email_missing_at_domain', score: '85%' }, // Invalid email!
      { name: 'David Carpenter', email: 'david.c@valid.org', score: '94%' },
      { name: 'X', email: 'too_short_name@valid.org', score: '90%' }, // Invalid name < 2 chars!
      { name: 'Eva Rostova', email: 'eva.rostova@valid.org', score: '99% (Honors)' },
      { name: 'Frank Miller', email: 'frank.m@valid.org', score: '91%' },
      { name: '   ', email: 'empty_name@valid.org', score: '80%' }, // Empty name!
      { name: 'Grace Hopper Jr', email: 'grace@valid.org', score: '97%' },
    ],
  },
  {
    id: 'enterprise_bulk',
    label: '⚡ Enterprise Bulk Cohort',
    badge: '20 Recipients',
    badgeColor: 'blue',
    eventName: 'Cloud Native Microservices & Kubernetes Accreditation',
    orgName: 'Cloud Native Computing Foundation',
    issueDate: 'October 13, 2026',
    signatoryName: 'Brendan Burns',
    signatoryTitle: 'Kubernetes Co-Creator & VP Engineering',
    theme: 'executive_navy' as const,
    recipients: Array.from({ length: 20 }, (_, i) => ({
      name: `Candidate ${i + 1} Enterprise`,
      email: `candidate.${i + 1}@enterprise-cloud.io`,
      score: `${90 + (i % 10)}%`,
    })),
  },
];

export const GeneratorStudio: React.FC<GeneratorStudioProps> = ({
  onSubmitJob,
  onPreviewSample,
  isSubmitting,
}) => {
  const [eventName, setEventName] = useState('Executive Cloud & Distributed Systems Architecture');
  const [orgName, setOrgName] = useState('Global Institute of Software Engineering');
  const [issueDate, setIssueDate] = useState('October 13, 2026');
  const [signatoryName, setSignatoryName] = useState('Dr. Evelyn Sterling');
  const [signatoryTitle, setSignatoryTitle] = useState('Dean of Technology & Fellowship Chair');
  const [theme, setTheme] = useState<'royal_gold' | 'executive_navy' | 'academic_emerald' | 'modern_tech'>('royal_gold');
  const [asyncProcessing, setAsyncProcessing] = useState(true);

  const [recipients, setRecipients] = useState<RecipientInput[]>([
    { name: 'Devon Miles', email: 'devon.miles@techlead.io', score: '98% (Honors)' },
    { name: 'Aaliyah Vance', email: 'aaliyah@ai-research.org', score: '96%' },
    { name: 'Takeshi Kovacs', email: 'takeshi@neuralnet.jp', score: '94%' },
    { name: 'Nathalie Dupont', email: 'n.dupont@inria.fr', score: '99% (Summa Cum Laude)' },
    { name: 'Siddharth Rao', email: 'siddharth@polytechnic.in', score: '92%' },
  ]);

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [sampleRecipientIdx, setSampleRecipientIdx] = useState(0);

  // Validation helper
  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim());
  const isNameValid = (name: string) => name && name.trim().length >= 2;

  const validRecipientsCount = recipients.filter(
    (r) => isNameValid(r.name) && isEmailValid(r.email)
  ).length;
  const invalidRecipientsCount = recipients.length - validRecipientsCount;

  // Real-time preview SVG
  const sampleRecipient = recipients[sampleRecipientIdx] || {
    name: 'Sample Recipient',
    email: 'sample@domain.com',
    score: '98%',
  };

  const previewSvg = generateCertificateSvg({
    certificateId: 'PREVIEW-CERT-2026',
    verificationHash: 'PREVIEW-7F9A1B2C8D',
    recipientName: sampleRecipient.name || 'Sample Recipient',
    recipientEmail: sampleRecipient.email,
    eventName,
    organizationName: orgName,
    issueDate,
    signatoryName,
    signatoryTitle,
    score: sampleRecipient.score,
    theme,
  });

  const handleApplyPreset = (preset: (typeof PRESET_BATCHES)[0]) => {
    setEventName(preset.eventName);
    setOrgName(preset.orgName);
    setIssueDate(preset.issueDate);
    setSignatoryName(preset.signatoryName);
    setSignatoryTitle(preset.signatoryTitle);
    setTheme(preset.theme);
    setRecipients([...preset.recipients]);
    setSampleRecipientIdx(0);
  };

  const handleAddRecipient = () => {
    setRecipients([
      ...recipients,
      { name: '', email: '', score: '' },
    ]);
  };

  const handleRemoveRecipient = (idx: number) => {
    if (recipients.length <= 1) return;
    const updated = recipients.filter((_, i) => i !== idx);
    setRecipients(updated);
    if (sampleRecipientIdx >= updated.length) {
      setSampleRecipientIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleUpdateRecipient = (
    idx: number,
    field: keyof RecipientInput,
    value: string
  ) => {
    const updated = [...recipients];
    updated[idx] = { ...updated[idx], [field]: value };
    setRecipients(updated);
  };

  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split('\n');
    const parsed: RecipientInput[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      // Skip header line if present
      if (line.toLowerCase().startsWith('name,email')) continue;

      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        parsed.push({
          name: parts[0],
          email: parts[1],
          score: parts[2] || undefined,
        });
      }
    }

    if (parsed.length > 0) {
      setRecipients(parsed);
      setSampleRecipientIdx(0);
      setShowCsvModal(false);
      setCsvText('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !orgName.trim() || recipients.length === 0) return;

    await onSubmitJob({
      event_name: eventName,
      organization_name: orgName,
      issue_date: issueDate,
      signatory_name: signatoryName,
      signatory_title: signatoryTitle,
      template_theme: theme,
      recipients,
      async_processing: asyncProcessing,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Title & Presets Bar */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Bulk Certificate <span className="text-amber-400">Generator Studio</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Submit batch generation jobs, validate recipient credentials, and monitor asynchronous queue execution with fault-tolerant error isolation.
            </p>
          </div>

          {/* Quick Presets for Demo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Quick Demos:
            </span>
            {PRESET_BATCHES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="group flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 ring-1 ring-slate-800 hover:bg-slate-850 hover:text-white hover:ring-amber-500/40 transition-all shadow-sm"
              >
                <span>{preset.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                    preset.badgeColor === 'amber'
                      ? 'bg-amber-500/20 text-amber-300'
                      : preset.badgeColor === 'emerald'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Configuration Form & Recipient Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Event & Issuer Master Details */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl ring-1 ring-slate-800/60">
              <div className="flex items-center gap-2.5 mb-4 border-b border-slate-800 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <h2 className="text-base font-semibold text-white">
                  1. Certificate & Organization Metadata
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Event / Course / Award Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Masterclass in Scalable Distributed Systems"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Issuing Organization <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Acme Tech Institute"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Date of Issuance <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. October 13, 2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Authorized Signatory Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Dr. Sarah Jenkins"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Signatory Official Title
                  </label>
                  <input
                    type="text"
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Dean of Faculty & Vice President"
                  />
                </div>

                {/* Predefined Template Palette Picker */}
                <div className="sm:col-span-2 pt-1">
                  <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-amber-400" />
                    Predefined Template Palette
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'royal_gold', label: 'Royal Gold', border: 'border-amber-500', bg: 'bg-amber-950/30' },
                      { id: 'executive_navy', label: 'Executive Navy', border: 'border-blue-500', bg: 'bg-blue-950/30' },
                      { id: 'academic_emerald', label: 'Academic Emerald', border: 'border-emerald-500', bg: 'bg-emerald-950/30' },
                      { id: 'modern_tech', label: 'Modern Indigo', border: 'border-indigo-500', bg: 'bg-indigo-950/30' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id as any)}
                        className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium transition-all border ${
                          theme === opt.id
                            ? `${opt.border} ${opt.bg} text-white shadow-sm ring-1 ring-amber-400/50`
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full ${
                            opt.id === 'royal_gold'
                              ? 'bg-amber-400'
                              : opt.id === 'executive_navy'
                              ? 'bg-blue-400'
                              : opt.id === 'academic_emerald'
                              ? 'bg-emerald-400'
                              : 'bg-indigo-400'
                          }`}
                        />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Recipient Data & Bulk Editor */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl ring-1 ring-slate-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      2. Recipient Batch ({recipients.length})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Validation is verified per recipient. Invalid entries will fail safely without halting valid generations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
                    <span>Paste CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/30 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Validation Status Summary Pill */}
              <div className="flex items-center justify-between rounded-xl bg-slate-950/80 px-3.5 py-2 text-xs mb-3 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {validRecipientsCount} Valid
                  </span>
                  {invalidRecipientsCount > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {invalidRecipientsCount} With Warnings (Error Isolation Active)
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-[11px]">
                  Showing {recipients.length} total recipients
                </span>
              </div>

              {/* Recipient Rows List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {recipients.map((rec, idx) => {
                  const validName = isNameValid(rec.name);
                  const validEmail = isEmailValid(rec.email);
                  const hasIssue = !validName || !validEmail;

                  return (
                    <div
                      key={idx}
                      className={`group relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl p-2.5 border transition-all ${
                        hasIssue
                          ? 'border-amber-500/40 bg-amber-950/10'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[10px] font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSampleRecipientIdx(idx)}
                          title="Preview on certificate template"
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                            sampleRecipientIdx === idx
                              ? 'bg-amber-400 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-amber-300'
                          }`}
                        >
                          Preview
                        </button>
                      </div>

                      {/* Name input */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={rec.name}
                          onChange={(e) => handleUpdateRecipient(idx, 'name', e.target.value)}
                          placeholder="Recipient Full Name *"
                          className={`w-full rounded-lg border px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                            !validName
                              ? 'border-amber-500 bg-amber-950/20 focus:ring-1 focus:ring-amber-500'
                              : 'border-slate-800 bg-slate-900 focus:border-amber-500'
                          }`}
                        />
                        {!validName && (
                          <span className="text-[10px] text-amber-400 mt-0.5 block">
                            Min 2 characters required
                          </span>
                        )}
                      </div>

                      {/* Email input */}
                      <div className="flex-1">
                        <input
                          type="email"
                          value={rec.email}
                          onChange={(e) => handleUpdateRecipient(idx, 'email', e.target.value)}
                          placeholder="Email address *"
                          className={`w-full rounded-lg border px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                            !validEmail
                              ? 'border-amber-500 bg-amber-950/20 focus:ring-1 focus:ring-amber-500'
                              : 'border-slate-800 bg-slate-900 focus:border-amber-500'
                          }`}
                        />
                        {!validEmail && (
                          <span className="text-[10px] text-amber-400 mt-0.5 block">
                            Invalid email format
                          </span>
                        )}
                      </div>

                      {/* Score / Distinction input */}
                      <div className="w-full sm:w-32">
                        <input
                          type="text"
                          value={rec.score || ''}
                          onChange={(e) => handleUpdateRecipient(idx, 'score', e.target.value)}
                          placeholder="Score (Optional)"
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(idx)}
                        disabled={recipients.length <= 1}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Processing Options & Submit Trigger */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl ring-1 ring-slate-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="asyncProcessing"
                    checked={asyncProcessing}
                    onChange={(e) => setAsyncProcessing(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="asyncProcessing" className="text-xs font-semibold text-white cursor-pointer">
                      Asynchronous Background Queue (Recommended)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Returns immediate HTTP 202 Accepted and processes batch via background worker, tracking progress in real-time.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || recipients.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Submitting Job...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Generate {recipients.length} Certificates</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Interactive Template Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl ring-1 ring-slate-800/60">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Live Template Preview
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sample: {sampleRecipient.name || 'Recipient'} ({sampleRecipientIdx + 1} of {recipients.length})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSampleRecipientIdx((prev) => (prev > 0 ? prev - 1 : recipients.length - 1))
                  }
                  className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSampleRecipientIdx((prev) => (prev < recipients.length - 1 ? prev + 1 : 0))
                  }
                  className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Visual Vector Certificate Rendering */}
            <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-white shadow-2xl transition-all">
              <div
                className="w-full"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            </div>

            {/* Explanatory Callout */}
            <div className="mt-4 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Predefined Vector Template Specification</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Standard landscape 1200x850 aspect ratio diploma format.</li>
                <li>Ornate multi-tier border with corner florets & guilloche texture.</li>
                <li>Authentic embossed gold medallion seal of authenticity.</li>
                <li>Embeds unique SHA-256 verification hash and dynamic QR security code.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Paste Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-amber-400" />
              <span>Import Recipients from CSV</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Paste comma-separated data in the format: <br />
              <code className="text-amber-300">Name, Email, Score (optional)</code>
            </p>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Sarah Connor, s.connor@sky.net, 98%\nAlex Rivera, alex@poly.edu, 95%\nMarcus Vance, m.vance@studio.com, Distinction`}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
              >
                Import Recipients
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
