import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Code,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { CertificateMetadata } from '../types/index.ts';
import { downloadSvgFile, downloadPngFromSvg } from '../utils/canvasExport.ts';

interface CertificateModalProps {
  certificate: CertificateMetadata | null;
  onClose: () => void;
  onVerifyClick?: (token: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
  onVerifyClick,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  if (!certificate) return null;

  const verifyUrl = `${window.location.origin}/api/certificates/verify/${certificate.verification_hash}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    downloadSvgFile(
      certificate.svg_content,
      `certificate_${certificate.recipient_name.replace(/\s+/g, '_').toLowerCase()}`
    );
  };

  const handleDownloadPng = async () => {
    setDownloadingPng(true);
    try {
      await downloadPngFromSvg(
        certificate.svg_content,
        `certificate_${certificate.recipient_name.replace(/\s+/g, '_').toLowerCase()}`
      );
    } catch (err) {
      console.error('Failed to export PNG', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Certificate - ${certificate.recipient_name}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; background: #fff; min-height: 100vh; }
            svg { width: 100%; max-width: 1100px; height: auto; }
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: landscape; margin: 0; }
            }
          </style>
        </head>
        <body>
          ${certificate.svg_content}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">
                  Official Credential Preview
                </h3>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                  Cryptographically Signed
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ID: {certificate.certificate_id} • Hash: {certificate.verification_hash}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showCode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>{showCode ? 'View Visual' : 'View SVG Code'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40">
          {showCode ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[60vh]">
              <pre>{certificate.svg_content}</pre>
            </div>
          ) : (
            <div className="group relative mx-auto overflow-hidden rounded-xl border border-slate-700/80 bg-white shadow-xl transition-all duration-300">
              <div
                className="w-full"
                dangerouslySetInnerHTML={{ __html: certificate.svg_content }}
              />
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800/90 px-3 py-2 text-xs font-medium text-slate-200 ring-1 ring-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Verification Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Verification URL</span>
                </>
              )}
            </button>

            {onVerifyClick && (
              <button
                onClick={() => {
                  onClose();
                  onVerifyClick(certificate.verification_hash);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 ring-1 ring-blue-500/30 hover:bg-blue-500/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Verify Credential Live</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPng}
              disabled={downloadingPng}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{downloadingPng ? 'Exporting...' : 'Download PNG'}</span>
            </button>

            <button
              onClick={handleDownloadSvg}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all"
            >
              <Download className="h-4 w-4 text-slate-950" />
              <span>Download Vector SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
