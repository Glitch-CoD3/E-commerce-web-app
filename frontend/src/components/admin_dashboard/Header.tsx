'use client';

type HeaderProps = {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
};

export default function Header({ theme, setTheme }: HeaderProps) {
  const isDark = theme === 'dark';
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/40">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
            A
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Real-time ecommerce analytics & dynamic inventory hub.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all duration-200 ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
          }`}
        >
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Live</span>
        </div>
      </div>
    </header>
  );
}