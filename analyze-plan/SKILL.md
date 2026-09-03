---
name: analyze-plan
description: Iteratively review an existing plan-<slug>.md (or plan.md) doc against the real codebase, tighten it, and ask clarifying questions in rounds until every step is concrete enough to implement without further judgment calls.
---

This skill takes one argument: which plan doc to analyze (a slug, filename, or section, e.g.
`ui-design-fixes` or `plan-ui-design-fixes.md`). If omitted, use the plan doc open in the IDE if
there is one; otherwise `Glob plan-*.md` and ask the user which one (don't guess if more than
one is a plausible candidate).

This skill only edits the **plan doc's text** — grounding it in reality and folding in the
user's answers. It never touches application code, never checks off `- [ ]` steps, and never
changes the Status line to `In progress`/`Shipped`. The exit condition is the user saying
"implement this" — producing that moment is the whole point of the skill, not something it does
itself.

Your edits to the doc will fire the plan-change hook. Ignore its `reconcile-plans` nudge for
the whole run: if `reconcile-plans` invoked this skill, it's already handling the link graph;
if the user invoked it directly, finish tightening this doc first — the hook fires again on
your last edit, and reconciling siblings can happen then.

## Loop

Repeat this cycle — grounding pass → gap pass → self-review pass → question round → fold in
answers — until a full cycle turns up nothing new. Don't cap it at one round; anything
nontrivial genuinely takes more than one iteration (a first self-review pass catches
under-scoped fixes; a second catches problems the fixes themselves introduced).

1. **Grounding pass.** Plans drift from the code after they're written. For every file/line
   reference, claim about current behavior, and "what already exists" statement in the doc,
   verify it against the actual code right now with Grep/Read — don't trust the doc's own
   citations at face value. Flag (and fix, with a note) anything stale: a line range that's
   shifted, a function that's been renamed or removed, a "not yet built" claim that's since
   been built.

2. **Gap pass.** For every `Fix #N` / numbered section, check:
   - Is `### Problem` actually grounded in cited evidence, or does it assert something without a
     file/line backing it up?
   - Is `### Approach` concrete enough that two different engineers would implement it
     identically? A sentence like "check if a newer version fixes this, otherwise fall back to
     X" is a real, unresolved fork, not a decision — surface it as a question (step 4), don't
     leave it embedded as a hedge.
   - Are the `## Steps` atomic, ordered, and each naming an exact file (and ideally
     symbol/line)? A step that says "update the tests" without naming which test file/method
     isn't implementable without another lookup pass.
   - Are there missing steps this repo's conventions expect: a test per behavior change, a docs
     update if a route/contract changed, an index/cross-reference update?
   - Does anything in this section conflict with another section of the same doc, or with
     another plan doc touching the same files?
   - Sequencing: does this doc (or the step being analyzed) depend on another plan doc that
     hasn't shipped yet? If so, is that dependency stated as a **Sequencing note** already, or
     missing? This pass checks staleness *inward* — the doc against the code and its siblings.
     The reverse (a sibling changed and this doc must catch up) is `reconcile-plans`' job, and
     it calls back into this loop per affected doc.
   - Does `## Non-goals` actually cover the scope-adjacent things a reader would reasonably
     wonder about, given what the Approach sections above just decided?

3. **Self-review the gap pass.** Before turning findings into questions, check your own proposed
   resolutions the same way: does closing gap X introduce a new problem (a compile break
   elsewhere, a perf regression, a correctness edge case)? Fold any such correction into the
   finding itself rather than raising it as a separate later round.

4. **Ask, don't assume.** Split what step 2/3 turned up into two buckets:
   - **Resolvable yourself** — anything answerable by reading more code, checking another plan
     doc, or applying an existing documented convention. Resolve these directly and edit the
     doc; don't spend the user's turn on them.
   - **Genuinely the user's/stakeholder's call** — anything where the codebase is silent and
     reasonable engineers could land in different places (a UX tradeoff, a scope boundary, which
     of several valid technical approaches to commit to, an unstated priority between two
     findings). Batch these with `AskUserQuestion` (up to 4 per call, multiple calls if there
     are more), stating your recommended default per question so a quick "yeah, go with that" is
     enough of an answer.

   If a cycle produces zero questions in this bucket, the loop is done — skip straight to
   "Report".

5. **Fold answers back into the doc.** Update the affected `### Approach`/`## Steps` (and
   `## Non-goals` if an answer ruled something out) so the decision reads as a settled given,
   not as a changelog of this review. The doc should read clean and final.

6. Go back to step 1. Re-ground and re-check the sections you just edited (an answer can itself
   introduce a new gap — e.g. resolving "which approach" can turn one vague step into three
   concrete ones that now need their own file/line grounding).

## Report

When a full cycle closes with no new questions and no ungrounded claims left, tell the user
plainly that the plan is implementation-ready — every step names exact files and an unambiguous
action — and stop. Don't start implementing, and don't editorialize about *whether* the plan is
a good idea; that judgment call already happened when the plan was drafted/approved. If the user
interrupts mid-loop to answer only some questions or to say "good enough, implement it" before a
cycle fully closes, stop immediately and defer — this skill's job is to get the doc ready, not
to insist on finishing every round.
