import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Every page the site builds: the home page and one case study per project.
export const GET: APIRoute = async ({ site }) => {
  const projects = await getCollection('projects');
  const paths = ['/', ...projects.map((p) => `/projects/${p.id}/`)];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
