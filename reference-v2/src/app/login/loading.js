export default function LoginLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-8 rounded-xl border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="h-8 w-48 bg-slate-700/50 rounded mx-auto mb-3 animate-pulse" />
                    <div className="h-4 w-72 bg-slate-700/50 rounded mx-auto animate-pulse" />
                </div>
                <div className="space-y-6">
                    <div>
                        <div className="h-3 w-28 bg-slate-700/50 rounded mb-2 animate-pulse" />
                        <div className="h-12 w-full bg-slate-700/30 rounded animate-pulse" />
                    </div>
                    <div>
                        <div className="h-3 w-20 bg-slate-700/50 rounded mb-2 animate-pulse" />
                        <div className="h-12 w-full bg-slate-700/30 rounded animate-pulse" />
                    </div>
                    <div className="h-12 w-full bg-cyan-900/30 rounded animate-pulse mt-4" />
                </div>
            </div>
        </div>
    );
}
