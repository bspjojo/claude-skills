---
name: code-review-to-file
description: Review a codebase (or a given path/diff) and write the findings to a self-contained code-review-<date>.md at the repo root, so each finding can be worked through in its own clean session later. Findings are checked against the real code before they are written down.
---

This skill takes an optional argument: the review scope (a path, a branch/diff, or "entire codebase").
If none is given, default to the whole repo, and say so in the file's header.

This produces a **document**, not code changes. Never edit application code as part of this
skill. Fixing the findings is a separate task, one item per session, started by the user.

If the repo already has a review-findings convention (an existing `code-review-*.md`, a
`docs/reviews/` folder, a CONTRIBUTING note), follow it where it conflicts with the structure
below, and match the format of the sibling file. Note that a tracked-but-deleted
`code-review-findings.md` in `git status` usually means a previous batch was finished. Don't
resurrect that name; use the dated one.

1. **Run the review.** Invoke the `code-review` skill (Skill tool) with the scope as its arg,
   at the level the user asked for. Say "entire codebase, not just the diff" when the scope is
   the whole repo. Do not print its findings to the user as the final answer. They are raw
   input for the next step.

2. **Verify each finding against the code.** The review is read-only and can be wrong, stale,
   or miscounted (check that the number of findings it claims matches the number it lists).
   For every finding:
   - Read the cited file and lines yourself. Confirm the code does what the finding claims,
     and correct the line number to where it actually is.
   - Trace the failure scenario against the real code. Check the callers, any guard the review
     may have missed, and whether an existing test already covers it.
   - Classify it: **Confirmed** (you traced it), **Plausible** (looks right, could not fully
     trace it, or depends on runtime behaviour), or **Rejected** (the code guards against it or
     the claim is wrong). Keep Rejected findings out of the main list, but record them in a
     short "Rejected on verification" section with one line of why, so the next reviewer does
     not re-raise them.
   - Do not run the app or make code changes to verify. Reading is enough here. If running
     something would settle it, say so in that item's "Verify first".

3. **Find the product decisions.** Some fixes hinge on a behaviour choice that is the user's
   (what a locked account reveals, how to credit a deactivated user's open session). Mark
   these items `needs a product decision first` and state the options and the question. Don't
   pick silently, and don't block the whole file on them.

4. **Gather what a fresh session needs.** A later session starts with no memory of this one.
   For each kept finding, collect from the repo:
   - the exact files and line ranges (linked), plus the related files it touches
     (callers, tests, migrations, the sibling implementation to copy the pattern from)
   - any repo commands or gotchas needed to reproduce and test it (build flags, editions,
     processes to kill first). Take these from CLAUDE.md, memory or existing skills, not from
     guesses.
   - the commit-message style in `git log` so the fixes match it

5. **Write `code-review-<YYYY-MM-DD>.md` at the repo root.** If the file for today exists, add a
   `-2` suffix rather than overwriting. Structure:
   - `# Code review findings — <date>`, then a **Source** paragraph: the scope, the branch and
     commit reviewed (`git rev-parse --short HEAD`), what was and wasn't done (nothing run,
     tests not reviewed, etc.), and how many findings were Confirmed / Plausible / Rejected.
   - `## How to work through these`: one item per session and one commit per item, the
     commit style, the test/build commands and gotchas from step 4, a note that item numbers
     are local to this file, and a "check whether the finding still holds first" instruction,
     since the code may have moved since the review.
   - `## Suggested order` (by severity and by dependency between items, e.g. a shared ordering
     rule that two items must agree on) and a `## Summary table` (`#`, area, file, severity,
     verification, status).
   - One `## Item N — <short description>` section per finding, separated by `---`, each with:
     **File** (linked, with line), **Verification** (Confirmed/Plausible and what you traced),
     **Problem**, **Failure scenario** (concrete inputs to wrong output), **Suggested approach**
     (labelled as a suggestion, with the real fork if there is one), **Verify first**,
     **Done when** (testable, including the tests to add), and **Status:** `todo`
     (add `— needs a product decision first` where step 3 applies).
   - `## Rejected on verification` (omit if empty) and `## Not covered by this review`
     (what the review did not look at: tests, migrations, installer/CI/Docker, no dynamic pass).

   Never pre-tick anything, and never claim a finding is fixed. Stay factual: state what was
   read, not what was assumed.

6. **Report back.** Tell the user the path, the counts by verification status, the items that
   need their decision, and the coverage gaps. Keep it short. The file is the deliverable, so
   do not paste the findings again. Do not commit the file unless asked.
