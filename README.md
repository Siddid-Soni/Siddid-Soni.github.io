# siddid.me

Personal portfolio: one day in a low-poly 3D room. Built with Astro and Three.js and deployed to GitHub Pages.

- `npm run dev` starts the local dev server
- `npm test` runs the unit tests, and `npm run test:e2e` runs the browser tests
- `npm run build && npm run stills` regenerates the fallback stills and the OG image after changing the scene
- `npm run projects` re-renders the monitor images in `public/projects/`: the designed graphics in `scripts/project-art/`, the Armoury screenshot from its repo, and a scroll-through recording of monsooncoffee.co (needs `ffmpeg`)
- Edit `src/config.ts` (including `languages`, the books on the shelf) and `src/content/projects/*.md` to change the content
