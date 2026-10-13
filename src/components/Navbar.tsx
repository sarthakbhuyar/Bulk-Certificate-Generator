import React from 'react';
import { Award, Layers, ShieldCheck, Terminal, FileCode2, CheckCircle2, Sparkles, Download } from 'lucide-react';

export type ActiveTab = 'studio' | 'jobs' | 'verify' | 'tests' | 'python';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeJobsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeJobsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-md shadow-amber-500/20 ring-1 ring-amber-300/40">
            <Award className="h-6 w-6 text-slate-950" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-950">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Certi<span className="text-amber-400">Batch</span>
              </span>
              <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
                Bulk Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Asynchronous Generation & Verification Hub
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-900/90 p-1.5 ring-1 ring-slate-800">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Generator Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'jobs'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Job Monitor</span>
            {activeJobsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                {activeJobsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'verify'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Verify Credential</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'tests'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Test Suite & API</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'python'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCode2 className="h-4 w-4" />
            <span>Python Files</span>
          </button>
        </nav>

        {/* Right Action: Download ZIP & Status */}
        <div className="flex items-center gap-2">
          <a
            href="/api/project/download-zip"
            download="certibatch-bulk-certificate-generator.zip"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
            title="Download full source code ZIP archive"
          >
            <Download className="h-3.5 w-3.5 text-slate-950" />
            <span className="hidden sm:inline">Download Project (.ZIP)</span>
            <span className="sm:hidden">ZIP</span>
          </a>

          <div className="hidden items-center gap-1.5 rounded-full bg-emerald-950/70 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-800/60 lg:flex">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>API Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};
