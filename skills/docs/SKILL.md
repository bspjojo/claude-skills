---
name: docs
description: Write or update a runbook, dev-documentation doc, or end-user help doc, using the structure appropriate to that type and grounding every step/claim in the real repo instead of guessing.
---

This skill takes one argument: what to document and, ideally, what kind — e.g. "runbook for
database failover", "dev docs for the auth module", "help doc for CSV export", or just "document
the deploy rollback process". If no argument is given, ask what needs documenting before doing
anything else.

This produces **documentation files**, not application code changes. Never edit
application/library code as part of this skill. The one exception is a docstring/comment the user
explicitly asked to update alongside the doc — everything else (behavior, config, scripts) is
read-only source material.

## 1. Determine the doc type

Three types, each with a different reader and a different failure mode if you use the wrong
shape:

- **Runbook** — an operator (on-call engineer, whoever's holding the pager) following exact steps
  under time pressure, usually mid-incident or mid-maintenance-window. Optimize for
  copy-pasteable commands and zero ambiguity. Wrong shape = someone runs the wrong command at
  3am.
- **Dev documentation** — an engineer (often future-you or a new teammate) building a mental
  model of a system before changing it: READMEs, architecture docs, API references, ADRs.
  Optimize for *why*, not just *what* — code already shows what; docs earn their keep by
  explaining the decisions and shape code can't. Wrong shape = a doc that just restates the code
  and goes stale the first time the code changes.
- **Help documentation** — an end user (not necessarily technical, doesn't know or care about the
  internal implementation) trying to accomplish a task. Optimize for task-oriented steps in the
  product's own vocabulary. Wrong shape = a doc that leaks internal jargon, file paths, or code
  terms the reader has no way to map to what they see on screen.

If the argument names the type (or it's unambiguous from context, e.g. "postmortem-driven
incident procedure" → runbook), proceed. Otherwise ask via `AskUserQuestion` with the three
options above as the choices and a one-line description of each — don't guess, since the wrong
type produces a doc nobody will trust or use.

## 2. Survey what already exists

Before writing anything:

- `Glob` for existing docs of this type: `docs/runbooks/**`, `RUNBOOK*.md` for runbooks;
  `docs/**/*.md`, `README.md`, `ARCHITECTURE.md`, `docs/adr/**` for dev docs; `docs/help/**`,
  `docs/user/**`, `FAQ.md` for help docs. Adjust to whatever this repo actually uses — the goal is
  finding the repo's real convention, not imposing one.
- If a doc covering this exact topic already exists, **update it in place** rather than creating
  a duplicate. Say so and proceed with an update, not a new file.
- If an index/table-of-contents file exists (`docs/README.md`, a runbooks index, a help-center
  landing page), read it — both to match its format and so you can link the new doc from it later.
- Note the existing style: heading depth, whether steps are numbered or checklisted, whether
  commands are in fenced blocks, whether there's a standard header (owner, last-reviewed date,
  severity). Match it. A style-inconsistent doc reads as untrustworthy even when it's accurate.

If the repo has zero existing docs of this type, use the structures in step 4 as the default and
say you're establishing the convention (so the user can redirect if they already have one in
mind that just isn't in the repo yet, e.g. a wiki).

## 3. Decide location and filename

Follow the convention step 2 found. With no convention to follow, default to:

- Runbook: `docs/runbooks/<slug>.md`
- Dev doc: `docs/<slug>.md` (or `README.md` for a directory/module overview — ask before
  overwriting an existing README's unrelated content; append/insert a section instead of
  replacing it wholesale if it already covers other ground)
- Help doc: `docs/help/<slug>.md`

`<slug>` is a short kebab-case description of the topic, matching the naming pattern of sibling
docs if any exist.

## 4. Investigate, then write

Ground every procedural step and factual claim in the actual repo — Grep/Read the real scripts,
config, endpoints, and UI copy. Don't write a plausible-sounding command or a "should be roughly
this" description; find the real one. This matters differently per type:

- **Runbook**: every command must be the actual command that works in this repo — the real
  script path, the real flag names, the real service/process name. If a step depends on
  something environment-specific (which cluster, which credentials) that you can't verify, say so
  explicitly in the doc rather than inventing a placeholder that reads as real.

  Structure:
  - `# <Title>` — name the scenario, not the mechanism (e.g. "Database Failover", not "Running
    `failover.sh`").
  - A header block: **When to use this** (the trigger condition), **Severity/impact**,
    **Prerequisites** (access, tools, who to have on standby).
  - **Procedure** — numbered steps, each an exact, copy-pasteable command or action, with the
    expected output/result stated so the operator can confirm success before moving on.
  - **Verification** — how to confirm the fix actually worked, not just that the steps ran.
  - **Rollback / escalation** — what to do if a step fails or the situation doesn't resolve, and
    who/where to escalate to.
  - **Related runbooks** — cross-links, if any exist.

- **Dev documentation**: read the actual code structure (Glob/Grep the real modules, entry
  points, key files) before describing it. Prefer explaining *why* a decision was made (grounded
  in commit history/comments/context you have, stated as such) over restating what's already
  legible from reading the code — a docs reader can read the code too; they're here for the parts
  the code doesn't say.

  Structure depends on which kind of dev doc it is:
  - **README/overview**: purpose, setup/install steps (verified runnable, not assumed), directory
    structure with a one-line purpose per major piece, how to run tests, key architectural
    decisions with brief rationale.
  - **Architecture doc**: system overview, component responsibilities, data flow (a diagram if
    the artifact-diagramming skill or plain ASCII helps — don't force one if the system is
    simple), key integration points, notable constraints/tradeoffs.
  - **API reference**: one section per endpoint/function — signature, parameters (grounded in
    the actual type/validation, not assumed), return shape, error cases, a real example grounded
    in a working call if one exists in tests/examples.

- **Help documentation**: read the actual feature (UI copy, actual flow, actual button/field
  labels) rather than assuming standard terminology — use the exact words the user will see.
  Never surface internal terms (class names, internal endpoint paths, internal error codes)
  unless the user genuinely sees them.

  Structure:
  - `# <Task-oriented title>` phrased as what the user is trying to do (e.g. "Export your data as
    CSV", not "CSV Export Feature").
  - A one-line summary of what this accomplishes and any prerequisite (permissions, plan tier,
    prior setup).
  - Numbered steps in the product's actual UI vocabulary, each stating what the user should see
    happen.
  - **Common issues** section for predictable failure points (grounded in real validation/error
    messages if you can find them), not speculative troubleshooting.
  - Links to closely related help docs, if any exist.

## 5. Harden the draft

A first draft has gaps the same way a first-draft plan does:

- A runbook step that's accurate but skips a precondition check a real operator would need (is
  the service even in the state this procedure assumes?).
- A dev doc that describes the code as of today but doesn't flag the parts most likely to drift
  (config that's environment-specific, a component mid-migration).
- A help doc that uses a term the UI doesn't actually use, or skips what happens on the unhappy
  path (validation error, permission denied).

Re-read the doc once against the real repo (repeat step 4's grounding, specifically on anything
you wrote from memory rather than a direct Read/Grep) and fix what's wrong. Batch any genuinely
open questions (info you can't get from the repo — who to escalate to, which environment,
product-decision wording) via `AskUserQuestion` rather than inventing an answer.

## 6. Link it in

If step 2 found an index/table-of-contents/landing doc, add an entry for the new doc matching
the existing entries' format. If the doc updates an existing file instead of creating one, skip
this — it's already linked.

## Report

State what was written or updated, its path, and any open question that's still outstanding
(unverifiable environment detail, a wording call left to the user). Don't claim a runbook step
works if you couldn't verify the actual command — flag it instead.
