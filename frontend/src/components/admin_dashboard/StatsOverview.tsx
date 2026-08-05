'use client';

export default function StatsOverview({ cardBg }: { cardBg: string }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className={`${cardBg} p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden`}>
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Visitors</p>
        <div className="flex items-baseline justify-between mt-3">
          <span className="text-3xl font-extrabold tracking-tight">12,450</span>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+14%</span>
        </div>
      </div>
      <div className={`${cardBg} p-5 rounded-2xl border backdrop-blur-md`}>
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Pending Orders</p>
        <span className="text-3xl font-extrabold text-amber-500 mt-3 block">18</span>
      </div>
      <div className={`${cardBg} p-5 rounded-2xl border backdrop-blur-md`}>
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Paid Orders</p>
        <span className="text-3xl font-extrabold text-emerald-500 mt-3 block">342</span>
      </div>
      <div className={`${cardBg} p-5 rounded-2xl border backdrop-blur-md`}>
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Unpaid Orders</p>
        <span className="text-3xl font-extrabold text-sky-500 mt-3 block">7</span>
      </div>
      <div className={`${cardBg} p-5 rounded-2xl border backdrop-blur-md`}>
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Cancelled</p>
        <span className="text-3xl font-extrabold text-rose-500 mt-3 block">4</span>
      </div>
    </section>
  );
}