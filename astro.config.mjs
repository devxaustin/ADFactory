import { defineConfig } from 'astro/config';

// GitHub Pages path handling, derived from the repo that builds the site.
// - Repo named <owner>.github.io  -> served at the root, base "/"
// - Any other repo name           -> served at /<repo-name>
// Locally (no GITHUB_REPOSITORY), base stays "/" so `npm run dev` just works.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const owner = process.env.GITHUB_REPOSITORY_OWNER ?? 'devxaustin';
const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;

export default defineConfig({
  site: `https://${owner.toLowerCase()}.github.io`,
  base: repo && !isUserSite ? `/${repo}/` : '/',
});
