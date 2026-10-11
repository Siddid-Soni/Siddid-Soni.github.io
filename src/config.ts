// Example content: replace with your own (spec §15).
import { siCplusplus, siGnubash, siGo, siJavascript, siLua, siPython, siQt, siRust, siTypescript } from 'simple-icons';

// SQL has no single logo: a database cylinder (24×24, like the simple-icons paths; the bands wind the other way, so
// they cut out under the default fill rule).
const DATABASE = 'M3 5.5C3 3.6 7 2 12 2s9 1.6 9 3.5v13c0 1.9-4 3.5-9 3.5s-9-1.6-9-3.5zM5 7.4v1.8c1.6 1 4.2 1.6 7 1.6s5.4-.6 7-1.6V7.4c-1.6 1-4.2 1.6-7 1.6S6.6 8.4 5 7.4zm0 5.4v1.8c1.6 1 4.2 1.6 7 1.6s5.4-.6 7-1.6v-1.8c-1.6 1-4.2 1.6-7 1.6S6.6 13.8 5 12.8z';
export const SITE = {
  name: 'Siddid Soni',
  role: 'Backend engineer',
  tagline: 'I build event-driven, high-throughput services in Rust.',
  about:
    'I’m a software engineer who likes turning fuzzy problems into small, reliable systems. I work across the stack, from interfaces people enjoy to the services behind them.',
  location: 'India · open to remote',
  email: 'hello@siddid.me', // replace with the address you want public
  github: 'https://github.com/Siddid-Soni',
  linkedin: 'https://www.linkedin.com/in/siddid',
  resume: '/resume.pdf',
  // The bookshelf in the 3D room: one labelled book per language, in its spine colour (ink is the title colour), with its
  // logo (an SVG path in a 24×24 box) on the spine and in the skills list.
  languages: [
    { name: 'Rust', color: '#b7410e', ink: '#fff1e6', icon: siRust.path },
    { name: 'TypeScript', color: '#3178c6', ink: '#ffffff', icon: siTypescript.path },
    { name: 'Python', color: '#2b5b84', ink: '#ffd43b', icon: siPython.path },
    { name: 'JavaScript', color: '#f0db4f', ink: '#2a2a1f', icon: siJavascript.path },
    { name: 'SQL', color: '#6b3fa0', ink: '#f3eaff', icon: DATABASE },
    { name: 'Lua', color: '#1f2a6b', ink: '#dfe4ff', icon: siLua.path },
    { name: 'QML', color: '#2fa84f', ink: '#062b12', icon: siQt.path },
    { name: 'Bash', color: '#2b3137', ink: '#7ee27a', icon: siGnubash.path },
    { name: 'C++', color: '#00599c', ink: '#ffffff', icon: siCplusplus.path },
    { name: 'Go', color: '#00add8', ink: '#05313d', icon: siGo.path },
  ],
  skills: [
    { area: 'Backend', items: ['Actix-Web', 'Axum', 'Tokio', 'gRPC', 'Kafka', 'RabbitMQ'] },
    { area: 'Data', items: ['PostgreSQL', 'Redis'] },
    { area: 'Web', items: ['Next.js', 'Django REST'] },
    { area: 'Infra', items: ['Docker', 'AWS', 'GitHub Actions', 'Linux'] },
  ],
  afterHours: [
    { title: 'Neovim plugin', text: 'Real rustc errors for loose .rs files, where rust-analyzer stays quiet.', href: 'https://github.com/Siddid-Soni/standalone-rust-diagnostics.nvim' },
    { title: 'Omarchy plugins', text: 'A Windows-style Stop key for media, and the Ryoku desktop theme.', href: 'https://github.com/Siddid-Soni?tab=repositories&q=omarchy' },
    { title: 'SQLite from scratch', text: 'A SQLite engine in Rust that walks B-tree pages and uses indexes.', href: 'https://github.com/Siddid-Soni/sqlite-rust' },
    { title: 'This site', text: 'Built with Astro and Three.js. One day in my room.', href: 'https://github.com/Siddid-Soni/Siddid-Soni.github.io' },
  ],
} as const satisfies {
  name: string; role: string; tagline: string; about: string; location: string; email: string;
  github: string; linkedin: string; resume: string;
  languages: readonly { name: string; color: string; ink: string; icon: string }[];
  skills: readonly { area: string; items: readonly string[] }[];
  afterHours: readonly { title: string; text: string; href?: string }[];
};

export interface SectionDef { id: string; time: string; label: string; heading: string; align: 'left' | 'right' | 'center' }

export const SECTIONS: SectionDef[] = [
  { id: 'hero', time: '07:30', label: 'Morning', heading: `Hi, I’m ${SITE.name}.`, align: 'left' },
  { id: 'about', time: '09:00', label: 'Coffee', heading: 'About me', align: 'right' },
  { id: 'projects', time: '13:00', label: 'Work', heading: 'Things I’ve built', align: 'left' },
  { id: 'skills', time: '18:30', label: 'Golden hour', heading: 'What I work with', align: 'right' },
  { id: 'after-hours', time: '23:00', label: 'After hours', heading: 'After hours', align: 'left' },
  { id: 'contact', time: '00:00', label: 'Midnight', heading: 'Let’s build something together.', align: 'center' },
];
