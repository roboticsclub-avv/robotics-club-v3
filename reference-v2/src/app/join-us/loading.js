export default function JoinUsLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4">
            <div className="glass-card max-w-2xl w-full p-8 md:p-12 rounded-xl border border-white/10 shadow-2xl">
                <div className="text-center mb-10">
                    <div className="h-10 w-48 bg-slate-700/50 rounded mx-auto mb-3 animate-pulse" />
                    <div className="h-4 w-64 bg-slate-700/50 rounded mx-auto animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className={i > 6 ? "md:col-span-2" : ""}>
                            <div className="h-3 w-24 bg-slate-700/50 rounded mb-2 animate-pulse" />
                            <div className="h-10 w-full bg-slate-700/30 rounded animate-pulse" />
                        </div>
                    ))}
                    <div className="md:col-span-2 mt-4">
                        <div className="h-12 w-full bg-purple-900/30 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
