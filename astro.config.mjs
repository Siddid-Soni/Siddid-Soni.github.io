import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://siddid.me',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
