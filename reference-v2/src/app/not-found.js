import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a] text-white">
      <div className="text-[8rem] md:text-[10rem] font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-500/20 to-cyan-500/20 leading-none select-none">
        404
      </div>
      <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-bold font-mono text-red-400 mb-6">
        ERROR_404 // PAGE_NOT_FOUND
      </div>
      <h1 className="text-3xl font-bold font-orbitron mb-4">Signal Lost</h1>
      <p className="text-slate-400 mb-8 max-w-sm">
        The sector you are trying to scan does not exist or has been decommissioned.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 font-bold font-orbitron rounded text-sm hover:opacity-90 transition-opacity"
        >
          RETURN TO BASE
        </Link>
      </div>
    </div>
  );
}
