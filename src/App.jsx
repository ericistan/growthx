import { useEffect, useMemo, useState } from 'react'
import { ApiError, getAudit, submitAudit } from './api-client'
import { AuditOutputSchema } from './contracts.js'

const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const POLL_INTERVAL_MS = 3000
const LOOP_INTERVAL_MS = 4000

const auditSteps = [
  { label: 'Auditing page structure', detail: 'Mapping the offer, sections, and conversion path' },
  { label: 'Rewriting hero section', detail: 'Sharpening the promise and primary action' },
  { label: 'Checking rival pages', detail: 'Comparing category language and proof patterns' },
  { label: 'Rebuilding key sections', detail: 'Applying the strongest conversion principles' },
  { label: 'Running final QA', detail: 'Checking clarity, hierarchy, and mobile behavior' },
]

// Mock data shaped to match src/contracts.ts's AuditOutputSchema, used only
// in demo mode so the frontend is usable without the VPS API running.

const mockEvidence = [
  {
    id: 'evidence-1',
    claim: 'Specific, outcome-led headlines convert higher than category-led headlines.',
    sourceTitle: 'Unbounce — Conversion Benchmark Report',
    sourceUrl: 'https://unbounce.com/conversion-benchmark-report/',
    excerpt: 'Pages that named a concrete outcome in the H1 converted 34% higher than pages using abstract value props.',
  },
  {
    id: 'evidence-2',
    claim: 'One primary action in the hero outperforms two competing actions.',
    sourceTitle: 'Baymard Institute — CTA Usability Research',
    sourceUrl: 'https://baymard.com/blog/cta-usability',
    excerpt: 'Removing a second, competing action from the hero increased primary CTA engagement without harming secondary conversions.',
  },
  {
    id: 'evidence-3',
    claim: 'Proof shown before the first scroll boundary reduces early drop-off.',
    sourceTitle: 'NN/g — Trust Signals in the First Viewport',
    sourceUrl: 'https://www.nngroup.com/articles/trust-signals/',
    excerpt: 'Visitors who saw a proof element within the first viewport were significantly less likely to bounce before scrolling.',
  },
]

const severityOrder = ['high', 'medium', 'low']

const mockFindings = [
  {
    id: 'finding-1',
    category: 'cta',
    severity: 'high',
    observation: 'The primary call-to-action reads "Learn more" with no stated outcome.',
    evidence: 'Hero button copy: "Learn more" → links to /contact',
    recommendation: 'Name the concrete next step and the value on the other side of it.',
    evidenceId: 'evidence-2',
  },
  {
    id: 'finding-2',
    category: 'message',
    severity: 'high',
    observation: 'The H1 describes the product category instead of the outcome a buyer gets.',
    evidence: 'Hero heading: "The modern platform for team workflows"',
    recommendation: 'Lead with the buyer outcome before naming the category.',
    evidenceId: 'evidence-1',
  },
  {
    id: 'finding-3',
    category: 'trust',
    severity: 'medium',
    observation: 'No proof (logos, numbers, testimonials) appears before the first scroll boundary.',
    evidence: 'First viewport contains hero copy and CTA only, no proof elements',
    recommendation: 'Move a proof element above the fold, ahead of secondary explanation copy.',
    evidenceId: 'evidence-3',
  },
  {
    id: 'finding-4',
    category: 'structure',
    severity: 'low',
    observation: 'Two competing buttons appear in the hero, splitting attention.',
    evidence: 'Hero contains "Learn more" and "Contact sales" side by side',
    recommendation: 'Keep one primary action in the hero; demote the secondary action.',
    evidenceId: 'evidence-2',
  },
]

function buildVariantSrcDoc({ headline, cta }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, Inter, sans-serif; color: #14161a; background: #fff; }
  nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; border-bottom: 1px solid #eee; }
  nav .brand { font-weight: 700; font-size: 15px; }
  nav .links { display: flex; gap: 24px; font-size: 13px; color: #6b7280; }
  main { padding: 64px 48px; max-width: 760px; }
  h1 { font-size: 44px; line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 16px; }
  p.sub { font-size: 16px; color: #6b7280; margin: 0 0 28px; max-width: 520px; }
  a.cta { display: inline-flex; align-items: center; gap: 8px; padding: 14px 22px; background: #c7f36b; color: #101114; font-weight: 600; font-size: 14px; border-radius: 8px; text-decoration: none; }
  .proof { display: flex; gap: 16px; margin-top: 56px; }
  .proof div { height: 40px; width: 120px; background: #f3f4f6; border-radius: 6px; }
</style>
</head>
<body>
<nav><span class="brand">Acme Widgets</span><span class="links"><span>Product</span><span>Pricing</span><span>Docs</span></span></nav>
<main>
  <h1>${headline}</h1>
  <p class="sub">Evidence-backed landing page rebuild produced by the RePager agent crew.</p>
  <a class="cta" href="#contact">${cta} →</a>
  <div class="proof"><div></div><div></div><div></div></div>
</main>
</body>
</html>`
}

const mockVariants = [
  {
    variant: 'a',
    label: 'Variant A',
    hypothesis: 'Clarity and trust: lead with the outcome, move proof above the fold.',
    deploymentUrl: '/a/',
    qaStatus: 'pass',
    headline: 'Turn landing-page friction into a prioritized action plan',
    cta: 'Book a conversion audit',
  },
  {
    variant: 'b',
    label: 'Variant B',
    hypothesis: 'Problem framing: open with what visitors are losing today.',
    deploymentUrl: '/b/',
    qaStatus: 'pass',
    headline: 'See what your landing page is losing you every day',
    cta: 'Get the evidence-backed teardown',
  },
]

const mockQaReport = {
  status: 'pass',
  unsupportedClaims: [],
  brokenLinks: [],
  missingSections: [],
  notes: ['All copy claims map to an approved client claim or a cited evidence source.'],
}

const mockTrace = [
  { agent: 'browser-auditor', phase: 'audit', status: 'success', latencyMs: 4200, inputSummary: 'Captured DOM, screenshot, and readable text from the target page' },
  { agent: 'linkup-researcher', phase: 'research', status: 'success', latencyMs: 6100, inputSummary: 'Queried Linkup for conversion evidence matching audit findings' },
  { agent: 'section-architect', phase: 'strategy', status: 'success', latencyMs: 2800, inputSummary: 'Selected section order and rationale from findings and evidence' },
  { agent: 'copywriter', phase: 'copy', status: 'success', latencyMs: 3400, inputSummary: 'Drafted two headline and CTA variants from approved claims' },
  { agent: 'coder', phase: 'build', status: 'success', latencyMs: 1900, inputSummary: 'Built variant A and variant B as standalone pages' },
  { agent: 'qa', phase: 'qa', status: 'success', latencyMs: 1500, inputSummary: 'Checked claims, links, and required sections before deploy' },
]

const demoAuditOutput = {
  findings: mockFindings,
  evidence: mockEvidence,
  variants: mockVariants,
  qaReport: mockQaReport,
  trace: mockTrace,
}

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
    <div className="flex items-center gap-2.5" aria-label="RePager">
      <span className="grid size-7 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
        <span className="size-2.5 rotate-45 rounded-[2px] bg-[#c7f36b] shadow-[0_0_18px_rgba(199,243,107,0.45)]" />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#f4f4f5]">RePager</span>
    </div>
  )
}

function DemoModeControl({ demoMode, onToggleDemoMode }) {
  if (onToggleDemoMode) {
    return (
      <button
        className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition ${demoMode ? 'border-[#c7f36b]/35 bg-[#c7f36b]/10 text-[#c7f36b]' : 'border-white/[0.1] bg-white/[0.02] text-[#62666d] hover:text-[#a8adb5]'}`}
        onClick={onToggleDemoMode}
        type="button"
      >
        {demoMode ? 'Demo mode: on' : 'Demo mode: off'}
      </button>
    )
  }
  if (demoMode) {
    return (
      <span className="rounded-full border border-[#c7f36b]/35 bg-[#c7f36b]/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#c7f36b]">
        Demo mode
      </span>
    )
  }
  return null
}

function Shell({ children, stepLabel, demoMode, onToggleDemoMode }) {
  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-5 sm:px-8 lg:px-10">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.06]">
          <Brand />
          <div className="flex items-center gap-4">
            <DemoModeControl demoMode={demoMode} onToggleDemoMode={onToggleDemoMode} />
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#62666d]">
              <span className="size-1.5 rounded-full bg-[#58c47c] shadow-[0_0_10px_rgba(88,196,124,0.55)]" />
              {stepLabel}
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}

function InputScreen({ demoMode, error, onSubmit, onToggleDemoMode, url, setUrl }) {
  return (
    <Shell demoMode={demoMode} onToggleDemoMode={onToggleDemoMode} stepLabel="Ready">
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

const statusLabels = {
  queued: 'Queued',
  running: 'Running',
}

function ProcessingScreen({ demoActiveStep, demoMode, elapsedSeconds, hostname, loopStep, pollError, record }) {
  const isDemo = demoMode
  const progress = isDemo ? Math.round(((demoActiveStep + 1) / auditSteps.length) * 100) : null
  const activeIndex = isDemo ? demoActiveStep : loopStep

  return (
    <Shell demoMode={demoMode} stepLabel="Agents running">
      <section className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center py-16 sm:py-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#c7f36b]">
              {isDemo ? `Live run · ${progress}%` : `${statusLabels[record?.status] ?? 'Working'} · ${elapsedSeconds}s elapsed`}
            </p>
            <h1 className="text-3xl font-medium tracking-[-0.035em] text-[#f7f8f8] sm:text-5xl">Rebuilding {hostname}</h1>
            <p className="mt-4 text-[15px] leading-6 text-[#8a8f98]">Five specialist agents are working in sequence. This feed updates as each handoff completes.</p>
          </div>
          <span className="hidden font-mono text-xs text-[#4f5359] sm:block">RUN 01</span>
        </div>

        <div className="mt-10 h-px overflow-hidden bg-white/[0.07]">
          {isDemo ? (
            <div className="h-full bg-[#c7f36b] transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          ) : (
            <div className="h-full w-1/3 animate-pulse bg-[#c7f36b]/60" />
          )}
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
            {(isDemo ? auditSteps.slice(0, demoActiveStep + 1) : auditSteps).map((step, index) => {
              const isActive = index === activeIndex
              const isDone = isDemo && index < demoActiveStep
              return (
                <div className="flex gap-4 px-5 py-4 animate-[feed-in_350ms_ease-out_both]" key={step.label}>
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${isActive ? 'border-[#c7f36b]/45 bg-[#c7f36b]/10 text-[#c7f36b]' : 'border-[#58c47c]/30 bg-[#58c47c]/10 text-[#58c47c]'}`}>
                    {isActive ? <span className="size-1.5 animate-pulse rounded-full bg-current" /> : <CheckIcon />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className={`text-sm font-medium ${isActive ? 'text-[#f7f8f8]' : 'text-[#a8adb5]'}`}>{step.label}</p>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4f5359]">
                        {isDemo ? (isActive ? 'Working' : 'Done') : (isActive ? 'Working' : isDone ? 'Done' : 'Pending')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#62666d]">{step.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {!isDemo && pollError ? (
          <p className="mt-4 text-center text-xs text-[#f3c76b]">{pollError}</p>
        ) : null}
        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#4f5359]">Keep this tab open while the run completes</p>
      </section>
    </Shell>
  )
}

const severityTone = {
  high: 'text-[#ff8b8b] border-[#ff8b8b]/25 bg-[#ff8b8b]/10',
  medium: 'text-[#f3c76b] border-[#f3c76b]/25 bg-[#f3c76b]/10',
  low: 'text-[#8a8f98] border-white/[0.1] bg-white/[0.03]',
}

const qaTone = {
  pass: { text: 'text-[#58c47c]', border: 'border-[#58c47c]/25', bg: 'bg-[#58c47c]/10', label: 'QA passed' },
  revise: { text: 'text-[#f3c76b]', border: 'border-[#f3c76b]/25', bg: 'bg-[#f3c76b]/10', label: 'QA requested revisions' },
  block: { text: 'text-[#ff8b8b]', border: 'border-[#ff8b8b]/25', bg: 'bg-[#ff8b8b]/10', label: 'QA blocked deploy' },
}

function LivePreview({ mode, title, value }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white">
      <div className="flex h-8 items-center gap-1.5 border-b border-black/[0.06] bg-[#f4f4f5] px-3">
        <span className="size-1.5 rounded-full bg-black/15" />
        <span className="size-1.5 rounded-full bg-black/15" />
        <span className="size-1.5 rounded-full bg-black/15" />
      </div>
      <div className="h-[230px] overflow-hidden">
        <iframe
          className="h-[820px] w-[1280px] origin-top-left border-0"
          sandbox={mode === 'src' ? 'allow-scripts allow-same-origin allow-popups allow-forms' : ''}
          src={mode === 'src' ? value : undefined}
          srcDoc={mode === 'srcDoc' ? value : undefined}
          style={{ transform: 'scale(0.28)' }}
          title={title}
        />
      </div>
    </div>
  )
}

function VariantCard({ demoMode, variant }) {
  const tone = qaTone[variant.qaStatus] ?? qaTone.pass
  const label = variant.label ?? `Variant ${variant.variant.toUpperCase()}`
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[#f7f8f8]">{label}</span>
        <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${tone.text} ${tone.border} ${tone.bg}`}>{tone.label}</span>
      </div>
      {demoMode ? (
        <LivePreview mode="srcDoc" title={label} value={buildVariantSrcDoc(variant)} />
      ) : (
        <LivePreview mode="src" title={label} value={variant.deploymentUrl} />
      )}
      <p className="mt-3 text-xs leading-5 text-[#8a8f98]">{variant.hypothesis}</p>
      <a className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#c7f36b] hover:text-[#d5fa85]" href={variant.deploymentUrl} rel="noreferrer" target="_blank">
        Open live <ArrowIcon />
      </a>
    </div>
  )
}

function FindingRow({ evidenceById, finding, index }) {
  const evidence = evidenceById.get(finding.evidenceId)
  return (
    <div className="grid gap-3 py-5 sm:grid-cols-[28px_1fr_auto] sm:items-start">
      <span className="font-mono text-[10px] text-[#4f5359]">0{index + 1}</span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${severityTone[finding.severity]}`}>{finding.severity}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#62666d]">{finding.category}</span>
        </div>
        <h3 className="mt-2 text-sm font-medium text-[#f7f8f8]">{finding.observation}</h3>
        <p className="mt-1 text-xs leading-5 text-[#62666d]">{finding.recommendation}</p>
        {evidence ? (
          <a className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a8f98] hover:text-[#c7f36b]" href={`#${evidence.id}`}>
            ↳ {evidence.sourceTitle}
          </a>
        ) : null}
      </div>
    </div>
  )
}

function QaBanner({ report }) {
  const tone = qaTone[report.status] ?? qaTone.pass
  const issues = [
    ...report.unsupportedClaims.map((item) => `Unsupported claim: ${item.text}`),
    ...report.brokenLinks.map((link) => `Broken link: ${link}`),
    ...report.missingSections.map((section) => `Missing section: ${section}`),
  ]
  return (
    <div className={`rounded-lg border p-5 ${tone.border} ${tone.bg}`}>
      <div className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] ${tone.text}`}>
        <span className={`grid size-4 place-items-center rounded-full ${tone.bg}`}><CheckIcon /></span>
        {tone.label}
      </div>
      {issues.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm leading-6 text-[#d0d6e0]">
          {issues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#a8adb5]">{report.notes[0]}</p>
      )}
    </div>
  )
}

function TraceLog({ events }) {
  return (
    <details className="group overflow-hidden rounded-lg border border-white/[0.08] bg-[#0f1011]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#62666d]">
        Agent trace
        <span className="text-[#4f5359] transition group-open:rotate-90">▸</span>
      </summary>
      <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
        {events.map((event) => (
          <div className="flex items-center justify-between gap-4 px-5 py-3" key={`${event.agent}-${event.phase}`}>
            <div className="min-w-0">
              <p className="text-sm text-[#d0d6e0]">{event.agent} <span className="text-[#62666d]">· {event.phase}</span></p>
              <p className="mt-0.5 truncate text-xs text-[#62666d]">{event.inputSummary}</p>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-[#4f5359]">{event.latencyMs}ms</span>
          </div>
        ))}
      </div>
    </details>
  )
}

function ResultsScreen({ auditOutput, demoMode, hostname, onReset }) {
  const evidenceById = useMemo(() => new Map(auditOutput.evidence.map((item) => [item.id, item])), [auditOutput])
  const sortedFindings = useMemo(
    () => [...auditOutput.findings].sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)),
    [auditOutput],
  )

  return (
    <Shell demoMode={demoMode} stepLabel="Run complete">
      <section className="py-14 sm:py-20">
        <div className="flex flex-col justify-between gap-8 border-b border-white/[0.06] pb-10 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#58c47c]"><span className="grid size-4 place-items-center rounded-full bg-[#58c47c]/10"><CheckIcon /></span>Audit complete</div>
            <h1 className="text-4xl font-medium tracking-[-0.045em] sm:text-6xl">Two rebuilt variants are live.</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#8a8f98]">We rebuilt the highest-impact parts of {hostname}, backed each change with cited evidence, and deployed both variants for an A/B test.</p>
          </div>
          <button className="h-11 rounded-lg border border-white/[0.09] bg-white/[0.025] px-4 text-sm font-medium text-[#d0d6e0] transition hover:bg-white/[0.05]" onClick={onReset} type="button">New audit</button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {auditOutput.variants.map((variant) => <VariantCard demoMode={demoMode} key={variant.variant} variant={variant} />)}
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#62666d]">Findings</p>
              <h2 className="mt-4 text-2xl font-medium tracking-[-0.025em]">What changed, and why.</h2>
              <p className="mt-3 text-sm leading-6 text-[#8a8f98]">Every recommendation cites the audited page and, where relevant, a research source.</p>
            </div>
            <QaBanner report={auditOutput.qaReport} />
          </div>
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {sortedFindings.map((finding, index) => (
              <FindingRow evidenceById={evidenceById} finding={finding} index={index} key={finding.id} />
            ))}
          </div>
        </div>

        <div className="mt-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#62666d]">Evidence</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {auditOutput.evidence.map((item) => (
              <div className="scroll-mt-24 rounded-lg border border-white/[0.07] bg-white/[0.02] p-4" id={item.id} key={item.id}>
                <p className="text-sm leading-5 text-[#d0d6e0]">{item.claim}</p>
                <p className="mt-2 text-xs leading-5 text-[#62666d]">{item.excerpt}</p>
                <a className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#c7f36b] hover:text-[#d5fa85]" href={item.sourceUrl} rel="noreferrer" target="_blank">
                  {item.sourceTitle} <ArrowIcon />
                </a>
              </div>
            ))}
          </div>
        </div>

        {auditOutput.trace && auditOutput.trace.length > 0 ? (
          <div className="mt-10">
            <TraceLog events={auditOutput.trace} />
          </div>
        ) : null}
      </section>
    </Shell>
  )
}

function UnstructuredResultScreen({ hostname, onReset, parseError, record }) {
  return (
    <Shell stepLabel="Run complete">
      <section className="py-14 sm:py-20">
        <div className="border-b border-white/[0.06] pb-10">
          <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f3c76b]">
            <span className="grid size-4 place-items-center rounded-full bg-[#f3c76b]/10">!</span>
            Run completed, structured result unavailable
          </div>
          <h1 className="text-4xl font-medium tracking-[-0.045em] sm:text-6xl">Couldn&rsquo;t render a structured result.</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#8a8f98]">
            The run for {hostname} finished, but its output didn&rsquo;t match the expected format. {parseError}
          </p>
        </div>
        <div className="mt-6 space-y-1 font-mono text-xs text-[#62666d]">
          <p>Run ID: {record.runId}</p>
          {record.hermesRunId ? <p>Hermes run ID: {record.hermesRunId}</p> : null}
        </div>
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-white/[0.08] bg-[#0f1011] p-4 text-xs leading-5 text-[#a8adb5]">{record.output || '(no output)'}</pre>
        <button className="mt-8 h-11 rounded-lg border border-white/[0.09] bg-white/[0.025] px-4 text-sm font-medium text-[#d0d6e0] transition hover:bg-white/[0.05]" onClick={onReset} type="button">New audit</button>
      </section>
    </Shell>
  )
}

function FailedRunScreen({ hostname, onReset, record }) {
  return (
    <Shell stepLabel="Run failed">
      <section className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff8b8b]">
          <span className="grid size-4 place-items-center rounded-full bg-[#ff8b8b]/10">!</span>
          Run failed
        </div>
        <h1 className="text-4xl font-medium tracking-[-0.045em] sm:text-6xl">We couldn&rsquo;t finish auditing {hostname}.</h1>
        <p className="mt-4 max-w-lg text-[15px] leading-6 text-[#8a8f98]">{record.error || 'The audit run failed for an unknown reason.'}</p>
        <button className="mt-8 h-11 rounded-lg bg-[#c7f36b] px-5 text-sm font-semibold text-[#11130e] transition hover:bg-[#d5fa85]" onClick={onReset} type="button">Try again</button>
      </section>
    </Shell>
  )
}

function App() {
  const [phase, setPhase] = useState('input')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [demoMode, setDemoMode] = useState(() => !apiBaseUrl)
  const [demoActiveStep, setDemoActiveStep] = useState(0)
  const [runId, setRunId] = useState(null)
  const [record, setRecord] = useState(null)
  const [pollError, setPollError] = useState('')
  const [loopStep, setLoopStep] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const hostname = useMemo(() => {
    try { return new URL(url).hostname.replace(/^www\./, '') }
    catch { return 'your page' }
  }, [url])

  // Demo-mode fake progress timer.
  useEffect(() => {
    if (phase !== 'processing' || !demoMode) return undefined
    const timer = window.setInterval(() => {
      setDemoActiveStep((current) => {
        if (current >= auditSteps.length - 1) {
          window.clearInterval(timer)
          setPhase('result')
          return current
        }
        return current + 1
      })
    }, 900)
    return () => window.clearInterval(timer)
  }, [phase, demoMode])

  // Real-mode polling of the audit run.
  useEffect(() => {
    if (phase !== 'processing' || demoMode || !apiBaseUrl || !runId) return undefined
    let cancelled = false
    const timer = window.setInterval(async () => {
      try {
        const updated = await getAudit(runId, { baseUrl: apiBaseUrl })
        if (cancelled) return
        setRecord(updated)
        setPollError('')
        if (updated.status === 'completed' || updated.status === 'failed') {
          window.clearInterval(timer)
          setPhase('result')
        }
      } catch (err) {
        if (!cancelled) {
          setPollError(err instanceof ApiError ? err.message : 'Lost connection to the audit service. Retrying…')
        }
      }
    }, POLL_INTERVAL_MS)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [phase, demoMode, runId])

  // Real-mode elapsed-time counter, purely for display.
  useEffect(() => {
    if (phase !== 'processing' || demoMode) return undefined
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase, demoMode])

  // Real-mode indeterminate visual loop (no real step-by-step signal exists yet).
  useEffect(() => {
    if (phase !== 'processing' || demoMode) return undefined
    const timer = window.setInterval(() => {
      setLoopStep((step) => (step + 1) % auditSteps.length)
    }, LOOP_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [phase, demoMode])

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol')
    } catch {
      setError('Enter a complete URL beginning with http:// or https://')
      return
    }

    if (demoMode) {
      setError('')
      setDemoActiveStep(0)
      setPhase('processing')
      return
    }

    if (!apiBaseUrl) {
      setError('Real mode requires VITE_API_URL to be configured. Toggle demo mode on, or set VITE_API_URL.')
      return
    }

    setError('')
    try {
      const created = await submitAudit(url, { baseUrl: apiBaseUrl })
      setRunId(created.runId)
      setRecord(created)
      setLoopStep(0)
      setElapsedSeconds(0)
      setPollError('')
      setPhase('processing')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the audit service. Check your connection and try again.')
    }
  }

  function handleReset() {
    setUrl('')
    setError('')
    setDemoActiveStep(0)
    setRunId(null)
    setRecord(null)
    setPollError('')
    setLoopStep(0)
    setElapsedSeconds(0)
    setPhase('input')
  }

  function handleToggleDemoMode() {
    setDemoMode((current) => !current)
  }

  if (phase === 'processing') {
    return (
      <ProcessingScreen
        demoActiveStep={demoActiveStep}
        demoMode={demoMode}
        elapsedSeconds={elapsedSeconds}
        hostname={hostname}
        loopStep={loopStep}
        pollError={pollError}
        record={record}
      />
    )
  }

  if (phase === 'result') {
    if (demoMode) {
      return <ResultsScreen auditOutput={demoAuditOutput} demoMode hostname={hostname} onReset={handleReset} />
    }
    if (!record) return null
    if (record.status === 'failed') {
      return <FailedRunScreen hostname={hostname} onReset={handleReset} record={record} />
    }

    let parsedOutput = null
    let parseError = ''
    try {
      const json = JSON.parse(record.output ?? '')
      const result = AuditOutputSchema.safeParse(json)
      if (result.success) parsedOutput = result.data
      else parseError = `Response did not match the expected shape: ${result.error.issues[0]?.message ?? 'validation failed'}`
    } catch {
      parseError = 'Response was not valid JSON.'
    }

    if (parsedOutput) {
      return <ResultsScreen auditOutput={parsedOutput} demoMode={false} hostname={hostname} onReset={handleReset} />
    }
    return <UnstructuredResultScreen hostname={hostname} onReset={handleReset} parseError={parseError} record={record} />
  }

  return (
    <InputScreen
      demoMode={demoMode}
      error={error}
      onSubmit={handleSubmit}
      onToggleDemoMode={handleToggleDemoMode}
      setUrl={setUrl}
      url={url}
    />
  )
}

export default App
