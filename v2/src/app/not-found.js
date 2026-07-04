import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-8">
                <div className="text-[10rem] md:text-[14rem] font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-500/20 to-cyan-500/20 leading-none select-none">
                    404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-[10rem] md:text-[14rem] font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 leading-none opacity-10 blur-sm">
                        404
                    </div>
                </div>
            </div>

            <div className="glass-card p-8 md:p-12 max-w-lg w-full border border-slate-700/50 rounded-2xl">
                <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-bold font-mono text-red-400 mb-6">
                    ERROR_404 // PAGE_NOT_FOUND
                </div>
                <h1 className="text-3xl font-bold font-orbitron text-white mb-4">
                    Signal Lost
                </h1>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved to a different sector.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold font-orbitron rounded hover:opacity-90 transition-opacity text-sm"
                    >
                        RETURN TO BASE
                    </Link>
                    <Link
                        href="/#events"
                        className="px-6 py-3 glass-card border border-slate-600 text-slate-300 font-bold font-orbitron rounded hover:text-white transition-colors text-sm"
                    >
                        VIEW EVENTS
                    </Link>
                </div>
            </div>
        </div>
    );
}
