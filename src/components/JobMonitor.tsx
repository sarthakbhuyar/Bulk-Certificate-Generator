import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Eye,
  ShieldCheck,
  AlertTriangle,
  FolderArchive,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { CertificateJob, RecipientRecord, CertificateMetadata } from '../types/index.ts';
import { downloadSvgFile } from '../utils/canvasExport.ts';

interface JobMonitorProps {
  jobs: CertificateJob[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onRefreshJobs: () => void;
  onViewCertificate: (certId: string) => void;
  onVerifyToken: (token: string) => void;
  isLoading: boolean;
}

export const JobMonitor: React.FC<JobMonitorProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onRefreshJobs,
  onViewCertificate,
  onVerifyToken,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [isZipping, setIsZipping] = useState(false);

  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  // Recipient list filtering
  const filteredRecipients = activeJob?.recipients.filter((rec) => {
    const matchesSearch =
      rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.certificate_id && rec.certificate_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'success' && rec.status === 'success') ||
      (statusFilter === 'failed' && rec.status === 'failed');

    return matchesSearch && matchesStatus;
  }) || [];

  // Bulk ZIP download using JSZip
  const handleDownloadBulkZip = async () => {
    if (!activeJob) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`certificates_${activeJob.id}`);

      // Fetch all successful certificates
      const successfulRecipients = activeJob.recipients.filter(
        (r) => r.status === 'success' && r.certificate_id
      );

      for (const rec of successfulRecipients) {
        if (!rec.certificate_id) continue;
        try {
          const res = await fetch(`/api/certificates/${rec.certificate_id}`);
          if (res.ok) {
            const data: CertificateMetadata = await res.json();
            const safeName = rec.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            folder?.file(`${safeName}_${rec.certificate_id}.svg`, data.svg_content);
          }
        } catch (e) {
          console.error(`Failed to fetch certificate for ${rec.name}`, e);
        }
      }

      // Add a manifest summary text file
      const manifest = `BATCH CERTIFICATE EXPORT MANIFEST
Job ID: ${activeJob.id}
Event: ${activeJob.event_name}
Organization: ${activeJob.organization_name}
Date of Issuance: ${activeJob.issue_date}
Total Recipients: ${activeJob.total_recipients}
Successful Generations: ${activeJob.success_count}
Failed Generations: ${activeJob.failure_count}
Generated At: ${new Date().toISOString()}
`;
      folder?.file('manifest.txt', manifest);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificates_batch_${activeJob.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP archive', err);
    } finally {
      setIsZipping(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> Completed (100%)
          </span>
        );
      case 'partially_completed':
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30">
            <AlertTriangle className="h-3 w-3" /> Partially Completed
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/30">
            <RefreshCw className="h-3 w-3 animate-spin" /> Processing Batch
          </span>
        );
      case 'queued':
        return (
          <span className="flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold text-slate-300 ring-1 ring-slate-500/30">
            <Clock className="h-3 w-3" /> Queued
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/30">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
          <Layers className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white">No Generation Jobs Yet</h2>
        <p className="mt-1 text-sm text-slate-400">
          Submit your first bulk certificate generation batch from the Generator Studio.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
            Job Monitor & <span className="text-amber-400">Batch Progress</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time tracking of bulk certificate batches, progress percentage, and individual recipient validation results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshJobs}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>

          {activeJob && activeJob.success_count > 0 && (
            <button
              onClick={handleDownloadBulkZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/25 transition-all disabled:opacity-50"
            >
              <FolderArchive className="h-4 w-4" />
              <span>{isZipping ? 'Generating ZIP...' : `Bulk Export ZIP (${activeJob.success_count})`}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Job Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
            <span>Recent Generation Batches</span>
            <span>{jobs.length} Jobs Total</span>
          </div>

          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
            {jobs.map((job) => {
              const isSelected = job.id === activeJob?.id;
              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                    isSelected
                      ? 'border-amber-500/60 bg-slate-900 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] text-slate-400 truncate max-w-[170px]">
                      {job.id}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  <h3 className="font-semibold text-sm text-white line-clamp-1 mb-1">
                    {job.event_name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                    {job.organization_name}
                  </p>

                  {/* Progress Bar in card */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Progress</span>
                      <span className="font-mono font-medium text-slate-200">
                        {job.processed_count} / {job.total_recipients} ({job.progress_percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          job.status === 'completed'
                            ? 'bg-emerald-500'
                            : job.status === 'partially_completed'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${job.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <span className="text-emerald-400 font-medium">
                      ✓ {job.success_count} Succeeded
                    </span>
                    {job.failure_count > 0 && (
                      <span className="text-rose-400 font-medium">
                        ✗ {job.failure_count} Failed
                      </span>
                    )}
                    <span className="text-slate-400">
                      {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Job Detail & Recipient Table (8 cols) */}
        {activeJob && (
          <div className="lg:col-span-8 space-y-6">
            {/* Active Job Stats Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl ring-1 ring-slate-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-amber-400 font-semibold">
                      {activeJob.id}
                    </span>
                    {getStatusBadge(activeJob.status)}
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {activeJob.event_name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Issued by <strong className="text-slate-200">{activeJob.organization_name}</strong> on {activeJob.issue_date}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Signatory:</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {activeJob.signatory_name}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {activeJob.signatory_title}
                  </span>
                </div>
              </div>

              {/* Stat Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                    Total Recipients
                  </span>
                  <span className="text-xl font-bold text-white mt-0.5 block">
                    {activeJob.total_recipients}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                    Processed
                  </span>
                  <span className="text-xl font-bold text-blue-400 mt-0.5 block">
                    {activeJob.processed_count}
                  </span>
                </div>

                <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3 text-center">
                  <span className="text-[11px] text-emerald-400 uppercase tracking-wider block font-medium">
                    Successes
                  </span>
                  <span className="text-xl font-bold text-emerald-300 mt-0.5 block">
                    {activeJob.success_count}
                  </span>
                </div>

                <div className={`rounded-xl p-3 text-center border ${
                  activeJob.failure_count > 0
                    ? 'border-rose-900/50 bg-rose-950/20'
                    : 'border-slate-800 bg-slate-950/70'
                }`}>
                  <span className={`text-[11px] uppercase tracking-wider block font-medium ${
                    activeJob.failure_count > 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    Failures Isolated
                  </span>
                  <span className={`text-xl font-bold mt-0.5 block ${
                    activeJob.failure_count > 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {activeJob.failure_count}
                  </span>
                </div>
              </div>

              {/* Main Animated Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    {activeJob.status === 'processing' && (
                      <RefreshCw className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                    )}
                    Batch Processing Progress
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {activeJob.progress_percentage}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      activeJob.status === 'completed'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : activeJob.status === 'partially_completed'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${activeJob.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Informational callout if partial failure occurred */}
              {activeJob.status === 'partially_completed' && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Fault-Tolerance Verified: </strong>
                    {activeJob.failure_count} invalid recipient records were safely isolated with clear error logs. The remaining {activeJob.success_count} certificates were generated successfully without interrupting the job.
                  </div>
                </div>
              )}
            </div>

            {/* Recipient Item Details Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden ring-1 ring-slate-800/60">
              {/* Table Header & Search Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-sm">
                    Recipient Credentials & Outcomes
                  </h3>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                    {filteredRecipients.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Filter Buttons */}
                  <div className="flex rounded-lg bg-slate-900 p-0.5 ring-1 ring-slate-800 text-xs">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        statusFilter === 'all'
                          ? 'bg-slate-800 text-white font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('success')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        statusFilter === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Success ({activeJob.success_count})
                    </button>
                    {activeJob.failure_count > 0 && (
                      <button
                        onClick={() => setStatusFilter('failed')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          statusFilter === 'failed'
                            ? 'bg-rose-500/20 text-rose-300 font-medium'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Failed ({activeJob.failure_count})
                      </button>
                    )}
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search recipient..."
                      className="rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Recipient Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Outcome</th>
                      <th className="px-4 py-3">Certificate ID</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRecipients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No recipients matched filter
                        </td>
                      </tr>
                    ) : (
                      filteredRecipients.map((rec) => (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-850/60 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-white block">
                              {rec.name || <em className="text-slate-500">(Empty name)</em>}
                            </span>
                            {rec.score && (
                              <span className="text-[11px] text-emerald-400">
                                {rec.score}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 font-mono text-slate-300 text-[11px]">
                            {rec.email}
                          </td>

                          <td className="px-4 py-3">
                            {rec.status === 'success' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" /> Succeeded
                              </span>
                            )}
                            {rec.status === 'failed' && (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400 ring-1 ring-rose-500/30">
                                  <XCircle className="h-3 w-3" /> Failed
                                </span>
                                {rec.error_message && (
                                  <span className="block text-[10px] text-rose-400/90 mt-1 max-w-xs font-mono">
                                    {rec.error_message}
                                  </span>
                                )}
                              </div>
                            )}
                            {rec.status === 'processing' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-300">
                                <RefreshCw className="h-3 w-3 animate-spin" /> Processing
                              </span>
                            )}
                            {rec.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                                <Clock className="h-3 w-3" /> Queued
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 font-mono text-[11px]">
                            {rec.certificate_id ? (
                              <span className="text-amber-300 font-medium">
                                {rec.certificate_id}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {rec.status === 'success' && rec.certificate_id && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onViewCertificate(rec.certificate_id!)}
                                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                                  title="View Certificate Modal"
                                >
                                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                                  <span>View</span>
                                </button>

                                <a
                                  href={`/api/certificates/${rec.certificate_id}/download`}
                                  download
                                  className="rounded-lg bg-slate-800 p-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                  title="Download SVG"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>

                                {rec.verification_hash && (
                                  <button
                                    onClick={() => onVerifyToken(rec.verification_hash!)}
                                    className="rounded-lg bg-slate-800 p-1 text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors"
                                    title="Verify Credential"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
