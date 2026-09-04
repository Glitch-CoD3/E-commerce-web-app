'use client';

type HeaderProps = {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
};

export default function Header({ theme, setTheme }: HeaderProps) {
  const isDark = theme === 'dark';

  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b transition-colors duration-200 ${isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
    >
      {/* Brand & Page Info */}
      <div className="flex items-start sm:items-center gap-3">
        {/* Brand Logo/Icon */}
        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-indigo-500/20 shrink-0">
          A
        </div>

        {/* Text Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'
                }`}
            >
              Enterprise Management Hub
            </h1>
          </div>
          <p
            className={`text-xs sm:text-sm mt-0.5 font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
          >
            Real-time ecommerce analytics and dynamic inventory control platform.
          </p>
        </div>
      </div>

      {/* Control Actions & Status */}
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/30">
        {/* Live System Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${isDark
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider">
            System Live
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle Theme"
          className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all duration-200 ${isDark
            ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-slate-700'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
            }`}
        >
          {isDark ? (
            <>
              <span className="text-sm">☀️</span>
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <span className="text-sm">🌙</span>
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}