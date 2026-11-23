---
name: test
description: Run the project's unit/integration test suite and summarize results — pass/fail counts, plus the exact assertion and file/line for any failure.
---

1. **Identify the test runner** from the project: `test` script in `package.json`
   (jest/vitest/mocha/...); a `*.Tests.csproj` or `.sln` (`dotnet test`); `pytest`/`tox.ini`/
   `pyproject.toml` (`pytest`); `Cargo.toml` (`cargo test`); `go.mod` (`go test ./...`); a
   `Makefile` `test` target. If there's no test project/suite yet, tell the user and stop
   rather than inventing one.

2. Run the suite from the repo root (target the solution/workspace file if there is one).

3. Report a short pass/fail summary (counts). For any failure, show the **specific
   assertion/exception and the file/line it came from** — not a paraphrase.

4. Don't modify test files to make failing tests pass unless the user explicitly asks for a fix
   — this skill is for running and reporting, not silently patching.
