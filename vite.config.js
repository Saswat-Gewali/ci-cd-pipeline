import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves a project site from a subpath, not from the domain
  // root, so Vite's default base of '/' would emit asset paths like
  // /assets/index.js which 404 and leave the page blank. This value must match
  // the repo name, so the built HTML asks for
  // https://saswat-gewali.github.io/ci-cd-pipeline/assets/index.js
  //
  // Two consequences to remember, because both fail silently:
  //   1. Rename the repository and this must be changed to match.
  //   2. Opening dist/index.html straight from disk will not load the assets,
  //      because the absolute path resolves against the filesystem root. Use
  //      npm run preview, which serves dist/ at the right base.
  base: '/ci-cd-pipeline/',

  test: {
    // The logic under test is pure and has no DOM, so the fast node environment
    // is enough. No jsdom dependency needed.
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
