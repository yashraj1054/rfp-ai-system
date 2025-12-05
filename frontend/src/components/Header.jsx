export default function Header() {
  return (
    <header className="sticky top-0 z-40 mb-4 flex items-center justify-between gap-4 rounded-2xl bg-slate-50/90 px-4 py-3 shadow-lg backdrop-blur">
      <div className="app-header-left">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 to-blue-700 text-sm font-bold text-white">
            AI
          </span>
          RFP System
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Play with a simplified, AI-powered RFP system.
        </p>
      </div>
      <div className="text-right text-xs text-slate-500">
        <div className="inline-flex items-center rounded-full bg-slate-600 px-3 py-1 text-[11px] font-medium text-white">
          <a
            href="https://yashraj1054.github.io/Portfolio"
            target="_blank"
            rel="noreferrer"
          >
            Yashraj Singh
          </a>
        </div>
        <div>Author of Project</div>
      </div>
    </header>
  );
}
