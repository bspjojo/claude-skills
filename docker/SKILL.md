---
name: docker
description: Build and run the app via Docker Compose for local testing, tracking whether this skill run started the stack so it gets torn down again afterward.
---

1. Locate a Compose file at the repo root (`docker-compose.yml`, `compose.yml`, or a
   `docker-compose.*.yml` the project uses for local dev). If none exists, tell the user the
   project isn't set up for Compose and stop.

2. Check whether the stack is already up: `docker compose ps --status running`. If the app's
   service is already running, reuse it (report its URL/ports and skip to step 4) rather than
   starting a second instance — do **not** tear it down at the end in this case.

3. Otherwise, run `docker compose up --build -d` from the repo root, and note that this skill
   run started it, so it's responsible for stopping it later.

4. Report the published URL/port(s) (from the Compose file's `ports:` mapping) and any specific
   routes/pages or seeded credentials the project documents. If the build or start fails, show
   the Docker output **directly** rather than summarizing it.

5. Once done with the current task — **only if this skill run started it in step 3** —
   `docker compose down`. Leave it running if the user is still using it.

6. **If startup hangs on a database migration lock** (e.g. after a previous container was
   force-killed mid-migration — see the `dev` skill for the full explanation): the same fix
   applies, run against the db copied out of the container. For a named volume:
   `docker compose cp <service>:/path/to/app.db .`, run the clear-lock script against the copy,
   then `docker compose cp` it back before restarting. For a bind mount, edit the file at its
   host path directly.

This is deliberately thinner than the `dev` skill — `docker compose down` cleanly tears
everything down, so there's no orphaned-process bookkeeping to do.
