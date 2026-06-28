import Link from 'next/link'
import { HardDrive, Cloud, Shield, Share2, Layers, KeyRound } from 'lucide-react'

export const runtime = 'nodejs'

export default function Home() {
  return (
    <div className="min-h-screen bg-radial from-slate-900 via-zinc-950 to-black text-slate-100 flex flex-col font-sans relative overflow-hidden select-none">

      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

      {/* Navigation Header */}
      <header className="h-20 max-w-7xl w-full mx-auto px-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
            SkyBox
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/login" className="px-4 py-2 text-slate-300 hover:text-white transition">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 bg-white text-zinc-950 hover:bg-slate-100 rounded-xl shadow-lg transition active:scale-95">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-20 flex flex-col items-center justify-center text-center space-y-12">

        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-xs font-bold uppercase tracking-wider text-violet-400 rounded-full mb-2">
            <Cloud className="w-3.5 h-3.5" />
            Modern Cloud Storage Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-indigo-200 to-violet-400">
            Storage Without Limits,<br />
            Powered by Telegram.
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Store, manage, and share your files securely in a private Telegram channel managed by an automated bot. No storage fees, just smooth transfers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center text-sm font-bold">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-xl shadow-violet-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl transition active:scale-[0.98]"
          >
            Sign In to Console
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-16">

          {/* Card 1 */}
          <div className="p-6 bg-white/2 border border-white/5 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-3.5 hover:border-white/10 transition">
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Secure User Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full user workspace privacy. Your files are isolated and can only be accessed using your unique credential session.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white/2 border border-white/5 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-3.5 hover:border-white/10 transition">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Large File Chunking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exceeding Telegram's 50MB bot upload limit? Files are automatically split into 40MB chunks and reconstructed on-the-fly when downloading.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white/2 border border-white/5 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left gap-3.5 hover:border-white/10 transition col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Public Sharing Links</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate secure sharing URLs. Set expiration timers and encrypt downloads with password hashes using <code className="text-[10px] text-cyan-400">bcryptjs</code>.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-white/5 flex items-center justify-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SkyBox Platform. All rights reserved.
      </footer>

    </div>
  )
}
