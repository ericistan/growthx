const stack = ['Vite', 'React', 'Tailwind CSS', 'Cloudflare Workers']

function App() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(129,140,248,0.16),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <nav className="flex items-center justify-between" aria-label="Primary navigation">
          <a className="text-lg font-semibold tracking-tight" href="/">
            GrowthX<span className="text-cyan-400">.</span>
          </a>
          <a
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/60 hover:text-white"
            href="https://github.com/ericistan/growthx"
            rel="noreferrer"
            target="_blank"
          >
            View repository
          </a>
        </nav>

        <section className="flex flex-1 items-center py-20">
          <div className="max-w-4xl">
            <p className="mb-6 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
              Deployed on Cloudflare Workers
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-7xl lg:text-8xl">
              GrowthX Starter
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              A clean Vite + React + Tailwind CSS foundation, ready for your next build.
            </p>

            <div className="mt-10 flex flex-wrap gap-3" aria-label="Technology stack">
              {stack.map((technology) => (
                <span
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur"
                  key={technology}
                >
                  {technology}
                </span>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <a
                className="rounded-xl bg-cyan-300 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                href="https://vite.dev/guide/"
                rel="noreferrer"
                target="_blank"
              >
                Start building
              </a>
              <a
                className="rounded-xl border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                href="https://developers.cloudflare.com/workers/"
                rel="noreferrer"
                target="_blank"
              >
                Cloudflare docs
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-6 text-sm text-slate-500">
          Plain JavaScript. Fast by default.
        </footer>
      </div>
    </main>
  )
}

export default App
