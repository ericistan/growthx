---
name: landing-page-agency
description: Use when RePager needs to audit a real landing page, ground recommendations in live evidence, generate two conversion variants, QA unsupported claims, and deploy verified output through the Hermes specialist crew.
version: 1.0.0
author: Hermes Buildathon Team
license: MIT
metadata:
  hermes:
    tags: [landing-pages, multi-agent, conversion, linkup, convex, cloudflare]
    related_skills: []
---

# RePager Landing Page Agency

## Overview

Operate RePager as a complete landing-page conversion agency, not a collection of chat prompts. A lead agent plans the job, specialists exchange typed artifacts under one run directory, QA gates release, and deployment happens only when evidence and output checks pass.

## When to Use

Use for a real client-approved landing page when the required outcome is a public, evidence-backed before/after result. Do not use for unsupported performance promises, deceptive urgency, or direct production-domain changes without owner approval.

## Required Inputs

Before work begins, require:

- Target URL and confirmation that the page owner approved the audit.
- Company name, product category, target buyer, and primary conversion action.
- Approved factual claims and assets in `inputs/client-brief.md`.
- Run ID in the form `run-YYYYMMDD-HHMMSS`.

If the client brief is missing, stop before copy generation. Auditing may proceed, but deployment may not.

## Artifact Contract

All handoffs live under `runs/<run-id>/`:

```text
manifest.json
source/page.html
source/page.txt
source/screenshot.png
audit/findings.json
research/evidence.json
strategy/sections.json
copy/copy.json
variants/a/index.html
variants/b/index.html
qa/report.json
deploy/result.json
events.jsonl
```

A specialist is not complete until its artifact exists, parses, and is referenced by a successful trace event.

## Workflow

### 1. Initialize

Run the workspace initializer or create the standard artifact tree. Set the manifest to `running`, include the real target URL, start time, and client-brief path. Completion criterion: every expected directory exists and the manifest contains the correct URL.

### 2. Audit and research in parallel

Dispatch two independent specialists:

- **Browser Auditor:** follow `prompts/browser-auditor.md`; write `audit/findings.json` and source captures.
- **Linkup Researcher:** use the tested adapter in `src/agents/linkup-researcher.ts`; write `research/evidence.json` with source URLs and excerpts.

Completion criterion: every finding quotes the actual page, and every research claim has a clickable source URL. Reject generic advice without evidence.

### 3. Architecture and copy in parallel

After audit and research validate, dispatch:

- **Section Architect:** follow `prompts/section-architect.md`; write `strategy/sections.json`.
- **Copywriter:** follow `prompts/copywriter.md`; write `copy/copy.json`.

Both receive the client brief, findings, and evidence. Completion criterion: every factual claim maps to either an approved client claim or an evidence ID.

### 4. Build two constrained variants

Dispatch the Coder with `prompts/coder.md`. It may read only approved inputs and must produce standalone HTML/CSS/minimal-JS pages at `variants/a/index.html` and `variants/b/index.html`.

- Variant A: clarity and trust hypothesis.
- Variant B: stronger problem framing and CTA hypothesis.

Completion criterion: both pages render, are visibly distinct, contain one primary CTA, and contain no placeholders or dead links.

### 5. QA gate

Dispatch QA with `prompts/qa.md`. It must write `qa/report.json` matching `QaReportSchema`.

Deployment is allowed only when:

```text
status = pass
unsupportedClaims = []
brokenLinks = []
missingSections = []
```

If QA returns `revise`, send only the listed failures to the Coder and allow one retry. A second failure marks the run `blocked`; preserve artifacts and do not hide the failure.

### 6. Deploy and verify

Deploy only QA-approved artifacts. Record public URLs in `deploy/result.json`, open them from a separate device, trigger one CTA event, and confirm it appears in Convex.

Completion criterion: a judge can open the public URL, see both variants, and inspect the trace and QA evidence.

## Observability Rules

Append one validated event per step to `events.jsonl` and mirror it to Convex when configured. Events include run ID, parent event ID, agent, phase, status, timestamps, latency, input summary, and output path. Never mark success without a persisted output path.

## Failure Policy

- Network/API failure: record `failure`, preserve prior artifacts, and stop that branch.
- Invalid JSON: reject and request one schema-corrected response.
- Unsupported claim: QA blocks deployment.
- Browser capture blocked: use Hermes browser extraction and screenshot; do not invent page content.
- Deployment blocked: keep local variants and deploy static Pages before debugging Worker routing.

## Verification Checklist

- [ ] Real owner-approved target URL in manifest
- [ ] Browser findings quote the source page
- [ ] Linkup evidence contains live source URLs
- [ ] Section and copy artifacts validate
- [ ] Two variants render and differ visibly
- [ ] QA has zero unsupported claims and broken links
- [ ] Public URL opens from another device
- [ ] Convex contains the run trace and a real click event
- [ ] Cloudflare, Convex, and Linkup dashboards are ready for demo
- [ ] Hermes session receipts are preserved
