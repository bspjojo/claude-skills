---
name: migrate
description: Create a new database migration, or apply pending migrations to the local dev database, using whatever migration tool the project uses.
---

This skill takes an optional argument: a migration name.

1. **Identify the migration tool** from the project:
   - EF Core — a `.csproj` referencing `Microsoft.EntityFrameworkCore`, a `Migrations/` folder.
     `dotnet ef migrations add <name> --project <csproj> --output-dir <existing-migrations-dir>`
     / `dotnet ef database update --project <csproj>`. The `--output-dir` matters — without it
     `dotnet ef` can create a second, wrong migrations folder.
   - Prisma — `schema.prisma`. `npx prisma migrate dev --name <name>`.
   - Knex / TypeORM / Sequelize — their respective `migrate:make` / `migration:generate` and
     `migrate:latest` / `migration:run` commands.
   - Alembic — `alembic.ini`. `alembic revision --autogenerate -m "<name>"` / `alembic upgrade
     head`.
   - Rails — `bin/rails db:migrate`.
   - Django — `python manage.py makemigrations` / `migrate`.
   - Raw SQL files in a `migrations/` dir with a custom runner — use the project's documented
     command.

   If the project isn't scaffolded / has no migration setup yet, tell the user and stop.

2. **If an argument was given** (a migration name): create the migration, then show the
   generated migration file(s) so the user can review the schema diff **before** applying it.

3. **If no argument was given**: apply all pending migrations to the **local dev** database,
   then list the applied migrations and report the current state.

4. If the migration CLI isn't installed (`dotnet-ef`, `alembic`, etc.), tell the user the
   install command — don't install it globally yourself without asking.

5. **Never run migrations against a production or shared database.** Only the local dev database.
   If the project's config points at anything that looks like a production path/host, stop and
   confirm with the user first.

6. **If applying migrations hangs on a stale advisory/migration lock** (a previous run was
   force-killed mid-migration): see the `dev` skill's migration-lock section — the fix is to
   clear the stale lock row directly, then retry.
