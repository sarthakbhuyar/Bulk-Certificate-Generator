/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { GeneratorStudio } from './components/GeneratorStudio.tsx';
import { JobMonitor } from './components/JobMonitor.tsx';
import { VerificationPortal } from './components/VerificationPortal.tsx';
import { TestRunner } from './components/TestRunner.tsx';
import { PythonCodeViewer } from './components/PythonCodeViewer.tsx';
import { CertificateModal } from './components/CertificateModal.tsx';
import { CertificateJob, CertificateJobRequest, CertificateMetadata } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [jobs, setJobs] = useState<CertificateJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [inspectCertificate, setInspectCertificate] = useState<CertificateMetadata | null>(null);
  const [verifyToken, setVerifyToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const pollIntervalRef = useRef<any>(null);

  // Fetch full details of all jobs
  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) return;
      const data = await res.json();
      const jobSummaries = data.jobs || [];

      // Fetch full details for the top jobs
      const fullJobs = await Promise.all(
        jobSummaries.map(async (summary: any) => {
          try {
            const detailRes = await fetch(`/api/jobs/${summary.id}`);
            if (detailRes.ok) {
              return await detailRes.json();
            }
          } catch (e) {
            console.error('Failed to fetch job detail', e);
          }
          return summary;
        })
      );

      setJobs(fullJobs);
      if (!selectedJobId && fullJobs.length > 0) {
        setSelectedJobId(fullJobs[0].id);
      }
    } catch (err) {
      console.error('Failed to load jobs', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Poll when any job is actively in 'queued' or 'processing' status
  useEffect(() => {
    const hasActiveJob = jobs.some(
      (j) => j.status === 'processing' || j.status === 'queued'
    );

    if (hasActiveJob) {
      pollIntervalRef.current = setInterval(() => {
        fetchJobs();
      }, 700);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [jobs]);

  const handleSubmitJob = async (request: CertificateJobRequest) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Failed to submit job: ${errorData.error || 'Server error'}`);
        return;
      }

      const responseData = await res.json();
      const newJobId = responseData.job_id || responseData.id;

      // Refresh list, select new job and transition user to the Job Monitor tab
      await fetchJobs();
      if (newJobId) {
        setSelectedJobId(newJobId);
      }
      setActiveTab('jobs');
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewCertificate = async (certId: string) => {
    try {
      const res = await fetch(`/api/certificates/${certId}`);
      if (res.ok) {
        const certData = await res.json();
        setInspectCertificate(certData);
      }
    } catch (err) {
      console.error('Failed to view certificate', err);
    }
  };

  const handleVerifyToken = (token: string) => {
    setVerifyToken(token);
    setActiveTab('verify');
  };

  const activeJobsCount = jobs.filter(
    (j) => j.status === 'processing' || j.status === 'queued'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeJobsCount={activeJobsCount}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'studio' && (
          <GeneratorStudio
            onSubmitJob={handleSubmitJob}
            onPreviewSample={(svg) => {
              setInspectCertificate({
                certificate_id: 'PREVIEW-SAMPLE',
                verification_hash: 'HASH-PREVIEW-001',
                recipient_name: 'Preview Recipient',
                recipient_email: 'sample@preview.com',
                event_name: 'Course Preview',
                organization_name: 'CertiBatch Studio',
                issue_date: 'October 2026',
                signatory_name: 'Signatory',
                signatory_title: 'Title',
                job_id: 'job_preview',
                issued_at: new Date().toISOString(),
                template_theme: 'royal_gold',
                svg_content: svg,
              });
            }}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === 'jobs' && (
          <JobMonitor
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            onRefreshJobs={fetchJobs}
            onViewCertificate={handleViewCertificate}
            onVerifyToken={handleVerifyToken}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'verify' && (
          <VerificationPortal
            initialToken={verifyToken}
            onViewCertificate={handleViewCertificate}
          />
        )}

        {activeTab === 'tests' && <TestRunner />}

        {activeTab === 'python' && <PythonCodeViewer />}
      </main>

      {/* Certificate Inspect Modal */}
      {inspectCertificate && (
        <CertificateModal
          certificate={inspectCertificate}
          onClose={() => setInspectCertificate(null)}
          onVerifyClick={handleVerifyToken}
        />
      )}

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CertiBatch • Bulk Certificate Generation & Verification Engine
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('tests')}
              className="hover:text-amber-400 transition-colors"
            >
              Run Integration Tests
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('python')}
              className="hover:text-amber-400 transition-colors"
            >
              View Python Implementation
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
