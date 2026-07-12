import { useEffect, useMemo, useState } from 'react'

const auditSteps = [
  { label: 'Auditing page structure', detail: 'Mapping the offer, sections, and conversion path' },
  { label: 'Rewriting hero section', detail: 'Sharpening the promise and primary action' },
  { label: 'Checking rival pages', detail: 'Comparing category language and proof patterns' },
  { label: 'Rebuilding key sections', detail: 'Applying the strongest conversion principles' },
  { label: 'Running final QA', detail: 'Checking clarity, hierarchy, and mobile behavior' },
]

const changes = [
  {
    title: 'Led with the buyer outcome',
    detail: 'The headline now names the result before explaining the product.',
    principle: 'Message match',
  },
  {
    title: 'Reduced the page to one primary action',
    detail: 'Competing buttons were removed from the first viewport.',
    principle: "Hick's law",
  },
  {
    title: 'Moved proof closer to the promise',
    detail: 'Evidence now appears before the visitor has to decide whether to scroll.',
    principle: 'Specificity',
  },
  {
    title: 'Answered the first objection earlier',
    detail: 'Risk and implementation concerns are handled before the final CTA.',
    principle: 'Friction reduction',
  },
]

function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 14 14" width="14">
      <path d="m3 7.25 2.4 2.4L11 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5" aria-label="GrowthX">
      <span className="grid size-7 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
        <span className="size-2.5 rotate-45 rounded-[2px] bg-[#c7f36b] shadow-[0_0_18px_rgba(199,243,107,0.45)]" />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">GrowthX</span>
    </div>
  )
}

function Shell({ children, stepLabel }) {
  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-5 sm:px-8 lg:px-10">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.06]">
          <Brand />
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#62666d]">
            <span className="size-1.5 rounded-full bg-[#58c47c] shadow-[0_0_10px_rgba(88,196,124,0.55)]" />
            {stepLabel}
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}

function InputScreen({ error, onSubmit, url, setUrl }) {
  return (
    <Shell stepLabel="Ready">
      <section className="flex flex-1 items-center justify-center py-20 sm:py-28">
        <div className="w-full max-w-[780px] text-center">
          <p className="mb-7 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a8f98]">
            Agentic conversion engineering
          </p>
          <h1 className="mx-auto max-w-[720px] text-[clamp(2.7rem,7vw,5.25rem)] font-medium leading-[0.98] tracking-[-0.055em] text-[#f7f8f8]">
            Rebuild your landing page around what converts.
          </h1>
          <p className="mx-auto mt-7 max-w-[560px] text-base leading-7 text-[#8a8f98] sm:text-lg">
            Paste any landing page. Our agents audit the story, study the category, and rebuild the highest-impact sections.
          </p>

          <form className="mx-auto mt-11 max-w-[720px]" onSubmit={onSubmit}>
            <div className="group flex flex-col gap-2 rounded-xl border border-white/[0.1] bg-[#0f1011] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition focus-within:border-[#c7f36b]/45 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="audit-url">Landing page URL</label>
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <span className="font-mono text-sm text-[#4f5359]">↗</span>
                <input
                  aria-describedby={error ? 'url-error' : undefined}
                  aria-invalid={Boolean(error)}
                  autoComplete="url"
                  className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-[#f7f8f8] outline-none placeholder:text-[#4f5359]"
                  id="audit-url"
                  inputMode="url"
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://yoursite.com"
                  type="text"
                  value={url}
                />
              </div>
              <button className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#c7f36b] px-5 text-sm font-semibold text-[#11130e] transition hover:bg-[#d5fa85] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c7f36b] active:translate-y-px" type="submit">
                Audit &amp; Rebuild
                <ArrowIcon />
              </button>
            </div>
            {error ? <p className="mt-3 text-left text-sm text-[#ff8b8b]" id="url-error">{error}</p> : null}
          </form>

          <div className="mt-6 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#4f5359]">
            <span>No account required</span>
            <span aria-hidden="true">·</span>
            <span>One URL, one flow</span>
            <span aria-hidden="true">·</span>
            <span>~90 sec</span>
          </div>
        </div>
      </section>
      <footer className="flex h-16 items-center justify-between border-t border-white/[0.06] text-xs text-[#4f5359]">
        <span>Built for focused landing-page iteration.</span>
        <span className="hidden font-mono sm:inline">AUDIT → REBUILD → VERIFY</span>
      </footer>
    </Shell>
  )
}

function ProcessingScreen({ activeStep, hostname }) {
  const progress = Math.round(((activeStep + 1) / auditSteps.length) * 100)

  return (
    <Shell stepLabel="Agents running">
      <section className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center py-16 sm:py-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#c7f36b]">Live run · {progress}%</p>
            <h1 className="text-3xl font-medium tracking-[-0.035em] text-[#f7f8f8] sm:text-5xl">Rebuilding {hostname}</h1>
            <p className="mt-4 text-[15px] leading-6 text-[#8a8f98]">Five specialist agents are working in sequence. This feed updates as each handoff completes.</p>
          </div>
          <span className="hidden font-mono text-xs text-[#4f5359] sm:block">RUN 01</span>
        </div>

        <div className="mt-10 h-px overflow-hidden bg-white/[0.07]">
          <div className="h-full bg-[#c7f36b] transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div aria-live="polite" className="mt-8 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1011]" role="log">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#62666d]">Agent activity</span>
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="size-1.5 rounded-full bg-white/15" />
              <span className="size-1.5 rounded-full bg-white/15" />
              <span className="size-1.5 rounded-full bg-[#c7f36b]" />
            </div>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {auditSteps.slice(0, activeStep + 1).map((step, index) => {
              const isActive = index === activeStep
              return (
                <div className="flex gap-4 px-5 py-4 animate-[feed-in_350ms_ease-out_both]" key={step.label}>
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${isActive ? 'border-[#c7f36b]/45 bg-[#c7f36b]/10 text-[#c7f36b]' : 'border-[#58c47c]/30 bg-[#58c47c]/10 text-[#58c47c]'}`}>
                    {isActive ? <span className="size-1.5 animate-pulse rounded-full bg-current" /> : <CheckIcon />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className={`text-sm font-medium ${isActive ? 'text-[#f7f8f8]' : 'text-[#a8adb5]'}`}>{step.label}</p>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4f5359]">{isActive ? 'Working' : 'Done'}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#62666d]">{step.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#4f5359]">Keep this tab open while the run completes</p>
      </section>
    </Shell>
  )
}

function PagePreview({ rebuilt }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border ${rebuilt ? 'border-[#c7f36b]/25 bg-[#0e100d]' : 'border-white/[0.08] bg-[#111214]'}`}>
      <div className="flex h-8 items-center gap-1.5 border-b border-white/[0.06] px-3">
        <span className="size-1.5 rounded-full bg-white/15" />
        <span className="size-1.5 rounded-full bg-white/15" />
        <span className="size-1.5 rounded-full bg-white/15" />
        <div className="ml-2 h-2 w-24 rounded bg-white/[0.06]" />
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-8 flex items-center justify-between">
          <div className={`h-2.5 rounded ${rebuilt ? 'w-16 bg-[#c7f36b]/70' : 'w-20 bg-white/20'}`} />
          <div className="flex gap-2"><span className="h-2 w-8 rounded bg-white/10" /><span className="h-2 w-8 rounded bg-white/10" /></div>
        </div>
        <div className={rebuilt ? 'max-w-[85%]' : 'max-w-full'}>
          <div className={`rounded ${rebuilt ? 'h-3 w-20 bg-[#c7f36b]/30' : 'h-2 w-16 bg-white/10'}`} />
          <div className={`mt-3 rounded bg-white/75 ${rebuilt ? 'h-5 w-[90%]' : 'h-4 w-full'}`} />
          <div className={`mt-2 rounded bg-white/75 ${rebuilt ? 'h-5 w-[65%]' : 'h-4 w-[82%]'}`} />
          <div className="mt-4 space-y-2"><div className="h-2 w-full rounded bg-white/10" /><div className={`h-2 rounded bg-white/10 ${rebuilt ? 'w-[78%]' : 'w-[92%]'}`} /></div>
          <div className="mt-5 flex gap-2">
            <div className={`h-8 rounded ${rebuilt ? 'w-24 bg-[#c7f36b]' : 'w-20 bg-white/25'}`} />
            {!rebuilt ? <div className="h-8 w-20 rounded border border-white/10" /> : null}
          </div>
        </div>
        <div className={`mt-8 grid gap-2 ${rebuilt ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {Array.from({ length: rebuilt ? 3 : 2 }).map((_, index) => <div className="h-14 rounded border border-white/[0.06] bg-white/[0.025]" key={index} />)}
        </div>
      </div>
      {rebuilt ? <div className="absolute right-3 top-11 rounded-full border border-[#c7f36b]/25 bg-[#c7f36b]/10 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#c7f36b]">Optimized</div> : null}
    </div>
  )
}

function ResultsScreen({ hostname, onReset }) {
  return (
    <Shell stepLabel="Run complete">
      <section className="py-14 sm:py-20">
        <div className="flex flex-col justify-between gap-8 border-b border-white/[0.06] pb-10 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#58c47c]"><span className="grid size-4 place-items-center rounded-full bg-[#58c47c]/10"><CheckIcon /></span>Audit complete</div>
            <h1 className="text-4xl font-medium tracking-[-0.045em] sm:text-6xl">Your rebuilt page is ready.</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#8a8f98]">We rebuilt the highest-impact parts of {hostname} and checked the final experience against four conversion principles.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="h-11 rounded-lg border border-white/[0.09] bg-white/[0.025] px-4 text-sm font-medium text-[#d0d6e0] transition hover:bg-white/[0.05]" onClick={onReset} type="button">New audit</button>
            <a className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#c7f36b] px-5 text-sm font-semibold text-[#11130e] transition hover:bg-[#d5fa85]" href="https://hermes-buildathon-agency.growthx-buildathon.workers.dev/" rel="noreferrer" target="_blank">View Live Preview <ArrowIcon /></a>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-[#a8adb5]">Original</span><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4f5359]">Captured</span></div><PagePreview rebuilt={false} /></div>
          <div><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-[#f7f8f8]">Rebuilt</span><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#c7f36b]">Production ready</span></div><PagePreview rebuilt /></div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#62666d]">Evidence summary</p>
            <h2 className="mt-4 text-2xl font-medium tracking-[-0.025em]">What changed, and why.</h2>
            <p className="mt-3 text-sm leading-6 text-[#8a8f98]">Every rewrite is tied to an observable conversion principle—not just a stylistic preference.</p>
            <div className="mt-6 rounded-lg border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#c7f36b]">Memory signal</p>
              <p className="mt-2 text-sm leading-6 text-[#a8adb5]">3 similar sections tested before. 2 past variants improved conversion.</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {changes.map((change, index) => (
              <div className="grid gap-3 py-5 sm:grid-cols-[28px_1fr_auto] sm:items-start" key={change.title}>
                <span className="font-mono text-[10px] text-[#4f5359]">0{index + 1}</span>
                <div><h3 className="text-sm font-medium text-[#f7f8f8]">{change.title}</h3><p className="mt-1 text-xs leading-5 text-[#62666d]">{change.detail}</p></div>
                <span className="w-fit rounded-full border border-white/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a8f98]">{change.principle}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  )
}

function App() {
  const [phase, setPhase] = useState('input')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(0)

  const hostname = useMemo(() => {
    try { return new URL(url).hostname.replace(/^www\./, '') }
    catch { return 'your page' }
  }, [url])

  useEffect(() => {
    if (phase !== 'processing') return undefined
    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= auditSteps.length - 1) {
          window.clearInterval(timer)
          setPhase('result')
          return current
        }
        return current + 1
      })
    }, 900)
    return () => window.clearInterval(timer)
  }, [phase])

  function handleSubmit(event) {
    event.preventDefault()
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol')
      setError('')
      setActiveStep(0)
      setPhase('processing')
    } catch {
      setError('Enter a complete URL beginning with http:// or https://')
    }
  }

  function handleReset() {
    setUrl('')
    setError('')
    setActiveStep(0)
    setPhase('input')
  }

  if (phase === 'processing') return <ProcessingScreen activeStep={activeStep} hostname={hostname} />
  if (phase === 'result') return <ResultsScreen hostname={hostname} onReset={handleReset} />
  return <InputScreen error={error} onSubmit={handleSubmit} setUrl={setUrl} url={url} />
}

export default App
