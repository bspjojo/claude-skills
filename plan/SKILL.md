---
name: plan
description: Draft a new plan-<slug>.md implementation-plan document at the repo root, with a Status line, per-item Problem/Approach/Steps, a Non-goals section, and cross-references to any sibling plan docs.
---

This skill takes one argument: a short description of the work to plan (e.g. "fix the
floating-label crash" or "add a CSV export retry"). If no argument is given, ask what the plan
should cover before doing anything else — don't guess scope for a brand-new plan doc.

This produces a **document**, not code changes. Never edit application code as part of this
skill; the plan is for the user to review before any implementation starts.

Drafting the doc will fire the plan-change hook on each Write. Ignore its `reconcile-plans`
nudge for the whole run — the doc isn't settled yet, and nothing downstream depends on a plan
that doesn't exist until you finish.

If the repo has its own established plan-doc convention (an existing `plan.md`, a `docs/plans/`
folder, a template, a CONTRIBUTING note), follow that instead of the structure below where they
conflict — this skill is the fallback when the repo has no convention of its own.

1. **Survey what already exists.** `Glob plan-*.md` (and `plan.md`, `docs/**/plan*.md`) at the
   repo root. If any existing doc has an index or "related plans" section, read it. This is how
   you avoid duplicate/colliding plans — if the requested work is already covered (fully or
   partially) by an existing plan doc, say so and ask whether to extend that doc instead of
   creating a new one, rather than silently starting a second plan for the same ground.

2. **Decide where this plan belongs.**
   - **A new section inside an existing top-level plan doc** — only when the work is a direct
     extension of that doc's existing numbered sections, not a standalone deliverable.
   - **A new standalone `plan-<slug>.md` companion doc** — the default for anything else (a
     bugfix batch, a feature, a rework of something already shipped). Pick `<slug>` as a short
     kebab-case description (e.g. `plan-ui-design-fixes`, `plan-export-perf`) that doesn't
     collide with an existing file from step 1.

3. **Investigate before writing.** Ground every "Problem" section in the real code before
   writing it — use Grep/Read/Glob to cite exact files and line ranges, and state things as
   confirmed-by-reading, not assumed or taken from the user's description alone.

4. **Write `plan-<slug>.md` at the repo root** with this structure:

   - `# <Title>` — descriptive, not just the slug.
   - `**Status:** <state>.` immediately under the title. One of: `Proposed — not started`,
     `Not started`, `In progress`, or `Shipped` (add `(Phases 1–N)` if phased, and a one-line
     commit/fix-count summary once it ships). If this doc depends on another plan doc (or vice
     versa), add a bold **Sequencing note:** paragraph right after Status spelling out the
     dependency and pointing at the specific section that must land first. If this note also
     changes how the *other* doc should read (e.g. its Non-goals should now point here), run the
     `reconcile-plans` skill on that doc once this draft is done.
   - An overview paragraph or two: what prompted this, what's in/out of scope, and any decisions
     already made by the stakeholder up front — state those as givens rather than re-litigating
     them later in the doc.
   - A **`**Commit granularity:**`** note if the plan will ship as multiple commits, stating the
     split and why (e.g. riskiest item last, unrelated items separated).
   - The body, divided by `---` rules. Pick whichever shape fits the work:
     - **Several discrete, independently-fixable problems** (a bugfix batch): one
       `## Fix #N — <short description>` section per problem, each with a `### Problem` (grounded
       per step 3, with file/line links) and `### Approach` (the chosen fix and, if there was a
       real choice, why), followed by a `## Steps` checklist (`- [ ]` per step — never write a
       plan with steps pre-checked). Steps that touch a file link it:
       `` [File.ext:12-34](path/to/File.ext#L12-L34) ``.
     - **One cohesive body of work** (a feature, a rework): `## 1. <Topic>`, `## 2. <Topic>`, …
       numbered sections, each still grounded in the real code. Add a "What already exists
       (don't rebuild this)" section up front if the work builds on substantial existing
       infrastructure.
   - `## Non-goals` near the end: explicitly list what this plan deliberately does *not* do and
     why, cross-referencing the specific section or other plan that covers it instead. This is
     what keeps scope from silently creeping mid-implementation.

5. **Cross-reference, don't duplicate.** Refer to other docs by filename and section, not by
   re-explaining what they already say.

6. **Harden the draft.** A first draft has gaps: an `### Approach` that hedges a real fork
   instead of deciding it, a `### Problem` that asserts something without the file/line citation
   step 3 was supposed to produce, `## Steps` that aren't atomic/concrete enough for two
   engineers to implement identically, a missing `## Non-goals` boundary a reader would
   obviously wonder about. If the `analyze-plan` skill is available, invoke it (Skill tool, arg:
   this plan's `<slug>`) and let its loop run to convergence. Otherwise, do one grounding →
   gap-pass → self-review pass yourself, batching any genuinely-the-stakeholder's-call questions
   via `AskUserQuestion` rather than guessing.

7. **Link the new doc** from whatever index/related-plans section step 1 found, if one exists,
   matching the existing entries' format. Do this after step 6 so the summary reflects the
   doc's final scope.

Implementing the plan (checking off `- [ ]` → `- [x]`, flipping the Status line) is a separate
task, triggered only by the user explicitly saying to proceed.
