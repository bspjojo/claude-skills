---
name: dev
description: Build and run the app locally for interactive manual testing, tracking the process this skill run starts so it gets stopped again afterward.
---

Prefer a project skill that already covers launching this app, or the built-in `run` skill, if
one fits better — this is the fallback for a plain "start it so I can click around."

1. **Figure out how this app runs.** Look for, in rough priority order: a `dev`/`start` script
   in `package.json`; a single main project file (`.csproj`, `Cargo.toml`, `go.mod`, `pom.xml`,
   `pyproject.toml`); a `Procfile` or `Makefile` target; a README "running locally" section. If
   nothing obvious exists yet, tell the user the app doesn't appear to be scaffolded/runnable
   yet and stop rather than guessing a command.

2. **Avoid watch/hot-reload modes for long-lived manual-testing sessions** unless the user asks
   for one. A watcher started in one session survives that session ending, and these accumulate
   as orphaned background processes across sessions — locking build output and silently serving
   stale binaries on the next build. A plain foreground run process is easier to track and stop.
   (`dotnet watch` in particular has a bad history of this — never use it here.)

3. **Check for an already-running instance before starting one.** Look for the app's process
   (by exe/port), and for orphaned watcher processes tied to this project. If a plain run
   process is already up, it wasn't started by this skill run — reuse it (report that it's up
   and its URL/ports), skip to step 5, and do **not** stop it in step 6. If you find stray
   watcher processes, they're very likely leftover cruft — confirm with the user before
   stopping them, then start a fresh plain run.

4. **Start it** with the plain run command from step 1, from the repo root. Note that this skill
   run started it, so it's responsible for stopping it later.

5. **Report the URL(s)/port(s) it's listening on** (from its startup log or the project's config
   — e.g. a Kestrel endpoint, a Vite port, `PORT` env). Mention any specific routes/pages the
   user will want if the project documents them.

6. **Leave it running in the foreground** unless the user asks for background, or you need to
   run other commands while verifying something. If the build fails, show the compiler/bundler
   errors **directly** — exact file/line — rather than summarizing them.

7. **Stop it when the current task is done** — manual verification finished, or moving on to
   unrelated work — **only if this skill run started it in step 4.** Prefer a graceful stop
   first (`Stop-Process -Id <pid>` with no `-Force`, or `kill <pid>`), give it ~2 seconds, and
   only escalate to a force kill if it's hung. Target the actual app process, not just a parent
   launcher (`dotnet run`, `npm run`, etc. spawn a child that outlives the parent kill and can
   lock build output). If you started it in the foreground and the user is still using it,
   leave it and skip this step.

## Database-migration-on-startup hangs (EF Core / similar)

If the app runs schema migrations on every startup and a previous process was force-killed
mid-migration, startup can hang on a stale migration lock — e.g. EF Core logging `Acquiring an
exclusive lock for migration application` and repeating `INSERT OR IGNORE INTO
"__EFMigrationsLock"` with a growing backoff that never resolves. Waiting doesn't fix it; the
lock row must be deleted directly.

For an EF Core + SQLite project, a throwaway file-based script clears it (.NET's
`dotnet run <file>.cs` supports inline `#:package` directives — no new project needed). Get the
db path from the project's connection string, and run with no dev-server process holding the db
open:

```csharp
// clear-migration-lock.cs
#:package Microsoft.Data.Sqlite@10.0.10
using Microsoft.Data.Sqlite;
var dbPath = args.Length > 0 ? args[0] : throw new ArgumentException("db path required");
using var conn = new SqliteConnection($"Data Source={dbPath}");
conn.Open();
using var cmd = conn.CreateCommand();
cmd.CommandText = "DELETE FROM __EFMigrationsLock;";
Console.WriteLine($"Deleted {cmd.ExecuteNonQuery()} row(s).");
```

```
dotnet run clear-migration-lock.cs -- path/to/app.db
```

This only touches the lock table, not app data. Other stacks have analogous advisory-lock
tables (`schema_migrations` lock rows, `pg_advisory_lock`, Flyway's `flyway_schema_history`
lock) — the fix is the same shape: clear the stale lock, then retry startup.
