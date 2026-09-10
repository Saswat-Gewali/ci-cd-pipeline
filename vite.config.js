import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves a project site from a subpath such as
  // https://user.github.io/repo-name/, so absolute asset paths like /assets/x.js
  // would 404 and the page would load blank. './' emits relative asset paths,
  // which work at any subpath and also work when opening dist/ locally, so the
  // build does not need to know the repo name.
  base: './',

  test: {
    // The logic under test is pure and has no DOM, so the fast node environment
    // is enough. No jsdom dependency needed.
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
