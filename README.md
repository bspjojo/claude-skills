# jt-dev

A Claude Code plugin with workflow skills:

| Skill | What it does |
|---|---|
| `plan` | Draft a new `plan-<slug>.md` implementation plan |
| `analyze-plan` | Check a plan doc against the codebase and tighten it until each step can be implemented as written |
| `reconcile-plans` | After a plan doc changes, re-check the sibling plan docs linked to it |
| `code-review-to-file` | Review the code and write the findings to `code-review-<date>.md` |
| `docs` | Write a runbook, dev doc, or end-user help doc |
| `dev` / `docker` | Run the app locally (process or Compose) and stop it afterward |
| `test` / `e2e` | Run the unit/integration or end-to-end suite and summarize the results |
| `migrate` | Create or apply database migrations |

It also ships a PostToolUse hook ([hooks/hooks.json](hooks/hooks.json)). When a `plan-*.md` file
is edited, the hook suggests running `reconcile-plans`.

## Install

The repo is its own marketplace. It's hosted on GitHub and on Azure DevOps. On each device, run
this in Claude Code:

```
/plugin marketplace add bspjojo/claude-skills
/plugin install jt-dev@jt-dev
```

To install from Azure DevOps instead, use
`/plugin marketplace add git@ssh.dev.azure.com:v3/thompsonjoseph0/ai-skills/claude-ai`.

Restart Claude Code afterwards. The skills are namespaced, for example `/jt-dev:plan`.

Each device needs:
- Access to the repo. For a private GitHub repo, that means git credentials or SSH keys that
  can clone it. For Azure DevOps, the SSH key you use for `git clone`.
- `node` on PATH, for the reconcile-plans hook.

You can also declare the plugin in `~/.claude/settings.json`. Claude Code should then offer to
install it when an interactive session starts. If it doesn't, run the two commands above.

```json
{
  "extraKnownMarketplaces": {
    "jt-dev": {
      "source": { "source": "github", "repo": "bspjojo/claude-skills" }
    }
  },
  "enabledPlugins": { "jt-dev@jt-dev": true }
}
```

## Updating

`plugin.json` has no `version` field on purpose, so every pushed commit counts as a new version.
To get the latest on a device:

```
/plugin marketplace update jt-dev
```

## Developing locally

To try changes before pushing, add a local clone as the marketplace instead:
`/plugin marketplace add C:/path/to/this/repo`.

## Layout

```
.claude-plugin/plugin.json       plugin manifest
.claude-plugin/marketplace.json  single-plugin marketplace (source: ./)
skills/<name>/SKILL.md           one folder per skill
hooks/hooks.json                 reconcile-plans PostToolUse hook
```
