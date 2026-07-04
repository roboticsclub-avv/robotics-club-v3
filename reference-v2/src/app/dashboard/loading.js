export default function DashboardLoading() {
    return (
        <div className="min-h-screen text-slate-100 p-4 md:p-8 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6 pt-16">
                    <div className="h-8 w-64 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-4 w-40 bg-slate-700/50 rounded animate-pulse" />
                </div>
                <div className="flex flex-wrap gap-2 md:gap-4 mb-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-9 w-32 bg-slate-700/50 rounded-lg animate-pulse" />
                    ))}
                </div>
                <div className="glass-card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card p-6">
                                <div className="h-4 w-32 bg-slate-700/50 rounded mb-3 animate-pulse" />
                                <div className="h-10 w-16 bg-slate-700/50 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-slate-700/30 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
