# CI/CD Pipeline Lab

## Project purpose

We are building a small web app and a GitHub Actions CI/CD pipeline that automatically
TESTS, BUILDS, and DEPLOYS it on every push. The pipeline has three jobs (test, build,
deploy) where each runs only if the previous one passed. Deployment target is GitHub Pages.

## Tech choices

- App: a small Vite app in plain JavaScript (no framework needed), with pure logic
  functions kept in their own module so they are easy to unit test.
- Tests: Vitest.
- Build: Vite's production build (`npm run build`), output to `dist/`.
- CI/CD: GitHub Actions, workflow file under `.github/workflows/`.
- Repo will be PUBLIC so Actions minutes are unlimited and free.

## Project layout

```
index.html                  Vite entry point
src/main.js                 wires the UI to the logic functions
src/logic.js                pure functions, no DOM, the unit test target
src/logic.test.js           Vitest unit tests
vite.config.js              base path must match the Pages URL subpath
package.json                scripts: dev, build, preview, test
.github/workflows/ci-cd.yml the three job pipeline
```

## Pipeline design

- Trigger on push to `main` and on `pull_request` to `main`.
- Job 1 `test`: install deps, run unit tests.
- Job 2 `build`: `needs: test`; run the production build; upload the result as a Pages artifact.
- Job 3 `deploy`: `needs: build`; deploy the artifact to GitHub Pages using the official
  Pages actions; use the `github-pages` environment and least privilege permissions
  (`pages: write`, `id-token: write`).

Why the jobs are split this way: each job is a separate checkpoint. A red test stops the
pipeline before anything is built, and a failed build stops it before anything is
published, so a broken commit can never reach the live site.

## Conventions

- Use current, maintained versions of official actions (for example `actions/checkout`,
  `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact`,
  `actions/deploy-pages`). If a version is deprecated, use the current one.
- Keep the workflow readable and commented so I can learn from it.
- Explain what you write; I want to understand the pipeline, not just run it.
- Do NOT use em dashes or en dashes anywhere in code, comments, or docs. Use commas or
  the word 'to' for ranges.
- Use `npm ci` in CI (reproducible installs from the lockfile), `npm install` locally.
- Commit `package-lock.json`; `npm ci` fails without it.
- Keep logic functions pure and free of DOM access so tests need no browser setup.
- `dist/` and `node_modules/` stay out of git.

## Local commands

```
npm install     install dependencies
npm run dev     local dev server
npm test        run unit tests once
npm run build   production build into dist/
npm run preview serve the built dist/ locally
```

## Repo setup steps done once by hand

1. Create the repo as PUBLIC on GitHub.
2. Settings, Pages, Source: set to "GitHub Actions" (not "Deploy from a branch").
3. Push to `main`; the workflow then runs and publishes the site.

## Do not

- Do not add cloud providers, secrets, or paid services. Everything stays within GitHub
  and is free.
- Do not deploy from pull requests; only pushes to `main` publish.
- Do not commit build output or dependencies.
