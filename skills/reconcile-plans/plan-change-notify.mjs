#!/usr/bin/env node
// PostToolUse hook: when an Edit/Write/MultiEdit touches a plan-<slug>.md doc, nudge Claude to
// reconcile any sibling plan docs linked to it. Advisory only — never blocks. Claude decides
// whether the change is cross-doc-relevant and skips edits made during its own reconcile run.

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let data = {};
  try {
    data = JSON.parse(raw || "{}");
  } catch {
    process.exit(0);
  }

  const ti = data.tool_input || {};
  const paths = [ti.file_path, ti.path, ti.notebook_path].filter(
    (p) => typeof p === "string" && p.length,
  );
  if (!paths.length) process.exit(0);

  const isPlanDoc = (p) => {
    const base = p.replace(/\\/g, "/").split("/").pop().toLowerCase();
    return /^plan(-[a-z0-9._-]+)?\.md$/.test(base);
  };
  const hit = paths.find(isPlanDoc);
  if (!hit) process.exit(0);

  const slug = hit
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .replace(/\.md$/i, "")
    .replace(/^plan-?/i, "");

  const context =
    `A plan doc was just modified: ${hit}\n\n` +
    `If this change altered anything other plan docs depend on — a renamed/renumbered section, ` +
    `an \`### Approach\` decision, scope moving in/out of \`## Non-goals\`, a Status transition, ` +
    `or a changed file/line target — invoke the reconcile-plans skill` +
    (slug ? ` (arg: "${slug}")` : "") +
    ` to re-check the sibling plan docs linked to it.\n\n` +
    `Skip this if: the edit was pure wording/typo, the section is still being drafted, or you ` +
    `made this edit as part of an in-flight plan / analyze-plan / reconcile-plans run.`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: context,
      },
    }),
  );
  process.exit(0);
});
