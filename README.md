# Tip and Bill Splitter

[![CI/CD Pipeline](https://github.com/Saswat-Gewali/ci-cd-pipeline/actions/workflows/pipeline.yml/badge.svg)](https://github.com/Saswat-Gewali/ci-cd-pipeline/actions/workflows/pipeline.yml)

**Live site: https://saswat-gewali.github.io/ci-cd-pipeline/**

A small web app that works out the tip, the total, and what each person owes on
a shared bill. The app itself is deliberately simple. The point of this
repository is the pipeline around it: every push to `main` is automatically
tested, built, and deployed to GitHub Pages with no manual steps.

The badge above reflects the latest run on `main`. Green means the tests passed,
the build succeeded, and the live site is up to date with this commit.

## What the app does

Enter a bill amount, a tip percentage, and a number of people. The page shows
the tip, the grand total, and the amount per person, recalculating as you type.

It also reports the rounding gap, which most splitter apps quietly hide. A 115
bill split three ways displays as 38.33 each, and 3 x 38.33 is 114.99, so the
app tells you the shares come up a penny short rather than pretending the
arithmetic is exact.

## The pipeline

Defined in [`.github/workflows/pipeline.yml`](.github/workflows/pipeline.yml).
It runs on every push to `main` and on every pull request targeting `main`.

```
push to main ──► [ Test ] ──► [ Build ] ──► [ Deploy ] ──► live site
                  49 tests     npm run build  deploy-pages
                               upload dist/

PR into main ──► [ Test ] ──► [ Build ] ──► (Deploy skipped)
```

Three jobs, each gated on the one before it with `needs:`, so nothing broken can
move down the chain.

| Job | Gate | What it does |
| --- | --- | --- |
| `test` | runs first | Installs with `npm ci`, runs the Vitest suite. A failing test stops everything here. |
| `build` | `needs: test` | Runs the Vite production build into `dist/`, then uploads it as a Pages artifact. |
| `deploy` | `needs: build` | Publishes the artifact to GitHub Pages using the `github-pages` environment. |

Three details worth knowing:

- **Pull requests are tested and built, but never deployed.** The deploy job is
  guarded with `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`,
  so an open pull request cannot overwrite the live site.
- **Each job runs on its own fresh virtual machine.** Nothing carries over
  between them, which is why `build` uploads `dist/` as an artifact instead of
  leaving it on disk for `deploy` to find.
- **Permissions are least privilege.** The workflow grants only `contents: read`
  at the top level. The `deploy` job adds `pages: write` and `id-token: write`
  for itself alone, so no other job holds the right to publish.

## Project structure

```
index.html                  Vite entry point, the form and the result rows
src/logic.js                pure calculation functions, no DOM
src/logic.test.js           49 Vitest unit tests
src/main.js                 reads the inputs, paints the results
vite.config.js              base path for Pages, plus Vitest config
.github/workflows/pipeline.yml   the three job pipeline
```

The split between `logic.js` and `main.js` is what makes the test stage
possible. All the arithmetic lives in pure functions that take values in and
return a value out, touching no DOM and no globals, so the tests call them
directly with no browser and no setup. Everything that does touch the page lives
in `main.js`, which has no tests and needs none.

## Running it locally

```bash
npm install     # install dependencies
npm run dev     # dev server with hot reload
npm test        # run the unit tests once
npm run build   # production build into dist/
npm run preview # serve the built dist/ locally
```

Use `npm run preview` rather than opening `dist/index.html` from disk. The build
emits absolute asset paths under `/ci-cd-pipeline/`, so a file opened directly
will not find its JavaScript.

## Tech stack

- **App:** Vite in plain JavaScript, no framework.
- **Tests:** Vitest, running in the node environment because the logic is pure.
- **CI/CD:** GitHub Actions, deploying to GitHub Pages.

Everything here is free and stays inside GitHub. There are no cloud providers,
no secrets, and no paid services.

## A note on the base path

`vite.config.js` sets `base: '/ci-cd-pipeline/'` because GitHub Pages serves a
project site from a subpath rather than the domain root. Vite's default of `/`
would emit asset paths like `/assets/index.js`, which 404 on Pages and leave a
blank page.

This value must match the repository name. Rename the repo and this needs
changing too, and nothing will warn you.
