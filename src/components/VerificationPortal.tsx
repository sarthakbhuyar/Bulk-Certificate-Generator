import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  User,
  Award,
  Hash,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface VerificationPortalProps {
  initialToken?: string;
  onViewCertificate?: (certId: string) => void;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  initialToken = '',
  onViewCertificate,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    verified: boolean;
    message: string;
    certificate?: any;
  } | null>(null);

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      performVerification(initialToken);
    }
  }, [initialToken]);

  const performVerification = async (token: string) => {
    const clean = token.trim();
    if (!clean) return;

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(clean)}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        verified: false,
        message: err.message || 'Verification service unreachable',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(tokenInput);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 mb-4 shadow-lg shadow-amber-500/10">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Certificate <span className="text-amber-400">Authenticity Verification</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
          Verify tamper-evident digital credentials issued by our platform. Validate issuing authority, recipient details, and cryptographic integrity.
        </p>
      </div>

      {/* Verification Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl ring-1 ring-slate-800/60 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter Certificate ID or Verification Hash (e.g. CERT-2026-0101)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying || !tokenInput.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Verify Credential</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-300">Quick Test Samples:</span>
          <button
            type="button"
            onClick={() => {
              setTokenInput('CERT-2026-0101');
              performVerification('CERT-2026-0101');
            }}
            className="rounded bg-slate-800 px-2 py-0.5 text-amber-300 hover:bg-slate-700 transition-colors font-mono"
          >
            CERT-2026-0101
          </button>
          <button
            type="button"
            onClick={() => {
              setTokenInput('CERT-2026-0102');
              performVerification('CERT-2026-0102');
            }}
            className="rounded bg-slate-800 px-2 py-0.5 text-amber-300 hover:bg-slate-700 transition-colors font-mono"
          >
            CERT-2026-0102
          </button>
        </div>
      </div>

      {/* Verification Outcome Card */}
      {result && (
        <div className="animate-fade-in">
          {result.verified && result.certificate ? (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl ring-1 ring-emerald-500/30">
              {/* Background watermark */}
              <div className="absolute -right-8 -top-8 text-emerald-500/5 pointer-events-none">
                <ShieldCheck className="h-64 w-64" />
              </div>

              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        Authentic Digital Credential Verified
                      </h3>
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                        Valid & Genuine
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Cryptographic Checksum Verified • Record Found in Primary Registry
                    </p>
                  </div>
                </div>

                {onViewCertificate && result.certificate.certificate_id && (
                  <button
                    onClick={() => onViewCertificate(result.certificate.certificate_id)}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/30 transition-all self-start sm:self-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View Official Certificate</span>
                  </button>
                )}
              </div>

              {/* Verified Details Matrix */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">Conferred Upon:</span>
                      <span className="font-serif text-lg font-bold text-white">
                        {result.certificate.recipient_name}
                      </span>
                      {result.certificate.score && (
                        <span className="text-xs text-emerald-400 font-medium block">
                          Honors / Score: {result.certificate.score}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">Course / Qualification:</span>
                      <span className="text-sm font-semibold text-slate-100">
                        {result.certificate.event_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">Issuing Authority:</span>
                      <span className="text-sm font-semibold text-slate-100">
                        {result.certificate.organization_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">Date of Issuance:</span>
                      <span className="text-sm font-semibold text-slate-100">
                        {result.certificate.issue_date}
                      </span>
                      <span className="text-xs text-slate-400 block">
                        Signatory: {result.certificate.signatory_name} ({result.certificate.signatory_title})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Hash Metadata Footer */}
              <div className="mt-6 rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span>Certificate ID: <strong className="text-white">{result.certificate.certificate_id}</strong></span>
                  <span>Verification Hash: <strong className="text-blue-400">{result.certificate.verification_hash}</strong></span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Issued Timestamp: {result.certificate.issued_at || new Date().toISOString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl ring-1 ring-rose-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40">
                  <XCircle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Verification Unsuccessful
                  </h3>
                  <p className="text-xs text-rose-300">
                    No authentic record matches the provided token or hash.
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                {result.message || 'The credential ID or verification hash was not found in the database. Please ensure the token was entered without typos.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
