---
name: reconcile-plans
description: After a plan-<slug>.md doc changes, find every sibling plan doc linked to it (in either direction) and re-ground the ones whose correctness the change affects, via the analyze-plan loop.
---

This skill takes one argument: which plan doc changed (a slug, filename, or path, e.g.
`export-perf` or `plan-export-perf.md`). If omitted, use the plan doc open in the IDE; else the
most recently modified `plan-*.md` (ask git if this is a repo); else `Glob plan-*.md` and ask
which one — don't guess if more than one is plausible.

This skill edits **plan-doc text only** — never application code, never checks off `- [ ]`
steps, never flips a Status line to `In progress`/`Shipped`. Same boundary as `analyze-plan`.

It exists because plan docs cross-reference each other — **Sequencing notes**, "handled by
`plan-X.md`" pointers in `## Non-goals`, shared file/section references. When one doc changes,
the docs tied to it can silently go stale in either direction.

## 1. Pin down what changed

Resolve the changed doc. If this is a git repo, look at the actual delta, not just the current
text: `git diff -- <path>` for uncommitted work, or `git log -p -1 -- <path>` for the last
commit. Note specifically:

- sections renamed / renumbered / removed,
- `### Approach` decisions that changed,
- scope moved in/out of `## Non-goals`,
- Status transitions (e.g. `Not started` → `Shipped`),
- changed file/line targets in `## Steps`.

If nothing in the change touches a cross-doc commitment — a typo fix, wording, or a section
still being drafted — say so and stop. There is nothing to reconcile.

## 2. Build the link graph

`Glob plan-*.md`, `plan.md`, and `docs/**/plan*.md` at the repo root. For every *other* doc,
record a link to the changed doc if **either**:

- it names the changed doc — its filename, title, or a section of it (a Sequencing note, a
  `## Non-goals` "covered by …" pointer, an inline cross-reference); **or**
- the changed doc names it.

Docs with no link in either direction are out of scope — do not touch them.

## 3. Triage each linked doc

For each linked doc, decide whether the step-1 delta actually invalidates something in it:

- A **Sequencing note** pointing at a section that was renamed / renumbered / removed, or
  assuming an ordering the Status change just altered.
- A **`## Non-goals`** pointer that now points at scope the changed doc no longer covers (or
  newly does).
- An **`### Approach` / `## Steps`** that relies on a contract, file, decision, or line range
  the changed doc just revised.
- A **"What already exists (don't rebuild this)"** claim the change contradicts.
- **Bidirectional:** does the changed doc now mis-describe a doc it references?

List the affected docs and, per doc, the specific stale spot. Linked docs that turn out
unaffected: record them as checked-and-clean.

## 4. Re-ground the affected docs

For each doc with a real staleness finding, run it through the full `analyze-plan` loop: invoke
`Skill(analyze-plan, <that doc's slug>)` and let it converge (grounding → gap → self-review →
question rounds). Do the affected docs one at a time.

If `analyze-plan` isn't available, run its loop inline: verify every file/line and "already
exists" claim against current code, fix each stale spot with a brief note, and batch genuine
stakeholder questions via `AskUserQuestion` with a recommended default per question.

Also fix the **changed doc itself** wherever step 3 found it now mis-describes a sibling.

## 5. Report

List each linked doc and its outcome: re-grounded (with what changed), checked-clean, or still
waiting on a user decision. Don't implement anything, and don't re-litigate whether the plans
are good ideas — that judgment already happened at drafting.

## Don't recurse

Editing these docs re-fires the plan-change hook. Ignore those prompts for any doc you touched
as part of this run — the reconciliation is already in flight.
