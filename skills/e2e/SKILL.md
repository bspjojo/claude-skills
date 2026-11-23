---
name: e2e
description: Run the project's end-to-end / browser test suite (Playwright, Cypress, or similar) and summarize results.
---

1. **Locate the suite.** Look for `tests/e2e/`, `e2e/`, `playwright.config.*`, `cypress.config.*`,
   or an `e2e`/`test:e2e` script. Note whether it's its own npm project (its own `package.json`)
   or part of the root one. If it doesn't exist yet, tell the user it hasn't been scaffolded and
   stop rather than inventing one.

2. **First run only** (or after pulling changes to the suite's `package.json`): install deps in
   the suite's directory, then install browser binaries if the framework needs them
   (`npx playwright install`, or Cypress's binary cache). This is a one-time-per-machine step.

3. **Run the suite** via its configured command (`npm test` / `npm run test:e2e` / `npx playwright
   test` / `npx cypress run`) from the suite's directory. If the suite starts its own app
   instance, confirm it uses an isolated DB/port (not a developer's real dev database) before
   running — most well-configured suites do; say so if it doesn't.

4. Report a short pass/fail summary (counts per project/spec). For any failure, show the
   **specific assertion/error and the spec file/line** — not a paraphrase. If a failure looks
   environment-related (port in use, a runtime not on PATH, browsers not installed), say so
   explicitly rather than treating it as a test bug.

5. On failure, mention the HTML report / traces / screenshots the framework captured
   (`npx playwright show-report`, Cypress's `videos/` + `screenshots/`) rather than opening it
   yourself.

6. Don't modify spec files to make failing tests pass unless the user explicitly asks for a fix.
