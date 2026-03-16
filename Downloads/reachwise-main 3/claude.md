# Reachwise / GetSignalHooks — Autonomous Execution Spec (for Claude)

You are the engineering agent. Your job is to **ship working code** in small, reviewable chunks with minimal back-and-forth. You must be **self-auditing**: every change you make should be verifiable via logs/tests and easy to review.

## Non-negotiables
- **Do not change backend logic** unless explicitly required for the task.
- Keep diffs **small and reviewable** (ideally < 400 LOC per PR).
- Every PR must include:
  - What changed (bullets)
  - Why (one paragraph)
  - How to test (step-by-step)
- No breaking changes to routes or DB schemas without a migration plan.
- Prefer **incremental refactors** over rewrites.

---

# How you should work (autonomous loop)

## Step 0 — Confirm repo + branch
- Work in: `https://github.com/IdrisL7/reachwise.git`
- Create a new branch: `feat/hooks-modernize-splitview` (or similar)

## Step 1 — Inspect current code
Before editing anything:
- Locate the current Hooks page entry file (likely `src/app/app/hooks/page.tsx` or similar).
- Identify current components used:
  - Hook form component (URL input + role selector + pitch context)
  - Hook cards
  - Company intelligence panel
  - Intent signals panel
- Identify existing UI primitives under `src/components/ui/*`.

---

# REQUIRED: Use sub-agent skills (where relevant)

Claude must use the most appropriate sub-agent capability for the task type:

- **Frontend/UI skill**: layout, component refactors, shadcn/radix components, Tailwind cleanup, state wiring.
- **Backend/API skill**: route changes, caching keys, diagnostics payloads, schema/migrations.
- **DB skill**: Drizzle/Turso schema changes, migrations, constraints, indexes.
- **Prompting/LLM skill**: system prompt changes, validators, tiering, gating behavior.
- **n8n/Automation skill**: workflows, lock/claim, safety checks, audit logs, connectors.
- **QA skill (MANDATORY)**: code review + tests + regression checks before any deploy.

**Rule:** Always explicitly state which skill you are using in each PR summary (e.g., “Skill used: Frontend/UI + QA”).

---

# REQUIRED: QA skill before test/deploy (no exceptions)

Before asking anyone to test or deploying any change, Claude must run a QA pass:

## QA checklist (run every PR)
1) **Static review**
   - Verify component boundaries are clean (no “god components”).
   - Confirm props/types are correct and minimal.
   - Confirm no dead code or unused imports.
   - Confirm consistent naming (role/angle/source/tier).

2) **Automated checks**
   - Run `pnpm lint` (or equivalent)
   - Run `pnpm test` (or equivalent)
   - Run `pnpm typecheck` (or equivalent, if configured)

3) **Manual regression (targeted)**
   - /app/hooks loads
   - Generate hooks works
   - Role selection persists/flows through
   - Evidence/Intent/Company panels render without errors
   - No layout shift on selection
   - Low-signal paths still render correctly

4) **Deliverable**
   - Attach a brief QA report in PR:
     - ✅ checks run + results
     - 🧪 manual steps performed
     - ⚠️ known risks

If QA fails, fix before proceeding.

---

# Task: Hooks Page Modernization (Split View) — Requirements

## Target UI behavior
### 1) Page header
- Title: “Generate Hooks”
- Keep progress indicator (Profile → Generate → Copy)

### 2) Inputs card (no behavior changes)
Keep current inputs:
- Company URL / target selector
- Company name (optional)
- Role selector (“Who are you emailing?”)
- Pitch context toggle (collapsed by default)
- CTA: “Generate Hooks”

### 3) Results split view
After generation completes:
- Left column: Hook list (Top 3 by default)
  - If more exist, show “Show N more”
- Right column: Details panel
  - Tabs: Evidence | Intent | Company
  - Hook actions: Copy hook, Copy hook + receipts, export actions (if present)
  - Channel variants: Email / LinkedIn / Call / Video (if available)

### 4) Selection logic
- Auto-select the first hook by default.
- Clicking a list item updates right panel content.
- No page scrolling required to view evidence after selecting a hook.

### 5) Badges
**Hook list (compact):**
- Role
- Angle (Trigger/Risk/Tradeoff)
- Source type (First-party/Reputable/Web)
- Confidence (optional)

**Details panel:**
- Everything else, including receipts, freshness, quality score, etc.

---

# File/Component Plan (implement as specified)

## New components (create these files)
- `src/app/app/hooks/hooks-header.tsx`
- `src/app/app/hooks/hooks-input-card.tsx` (wraps existing HookForm)
- `src/app/app/hooks/hooks-results-split-view.tsx`
- `src/app/app/hooks/hook-list.tsx`
- `src/app/app/hooks/hook-list-item.tsx`
- `src/app/app/hooks/hook-details-panel.tsx`
- `src/app/app/hooks/hook-actions.tsx`
- `src/app/app/hooks/channel-variants.tsx`
- `src/app/app/hooks/tabs/evidence-tab.tsx`
- `src/app/app/hooks/tabs/intent-tab.tsx`
- `src/app/app/hooks/tabs/company-tab.tsx`

## UI primitives (if missing)
- `src/components/ui/tabs.tsx`
- `src/components/ui/separator.tsx` (optional)
- `src/components/ui/tooltip.tsx` (optional)

## Existing files to modify
- `src/app/app/hooks/page.tsx` (or the current page file)
  - Add `selectedHookIndex` state
  - Render new layout
  - Wire selection into details panel

---

# Acceptance Criteria (must meet)
- `/app/hooks` shows split view after generation:
  - Left: top hooks list
  - Right: Evidence/Intent/Company tabs + actions
- Hooks are scannable: no “badge explosion.”
- Clicking a hook changes right panel without layout shift.
- No backend or DB behavior changes required.
- Build passes + lint passes.
- Include screenshots or a short GIF in PR description (if possible).

---

# How to test (manual)
1) Run app locally
2) Navigate to `/app/hooks`
3) Generate hooks for a known good domain (e.g., hubspot.com, gong.io)
4) Verify:
   - Top 3 hooks displayed in left list
   - First hook auto-selected
   - Evidence tab shows receipts for selected hook
   - Switching hook updates right panel
   - “Show more” works if >3 hooks exist
   - Channel variants appear in right panel
5) Confirm no regressions in existing generation flow.

---

# Reporting format (Claude must follow)
After each PR, post:
- ✅ Summary of changes
- 🧪 How to test
- 📌 Files changed
- ⚠️ Risks / follow-ups
- 🧰 Skill(s) used: (Frontend/UI, Backend/API, DB, Prompting, n8n/Automation)
- ✅ QA report: (lint/test/typecheck + manual regression steps)

Do not start a new PR until the previous PR is reviewed or explicitly approved.

---

# Notes
- Keep the current dark theme styling; just improve hierarchy and spacing.
- Prefer composability: HookListItem should be tiny and reusable.
- Avoid heavy design changes; this is layout + density + component hygiene.
