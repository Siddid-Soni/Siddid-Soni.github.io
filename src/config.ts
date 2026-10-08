// Example content: replace with your own (spec §15).
export const SITE = {
  name: 'Siddid Soni',
  role: 'Software Engineer',
  tagline: 'I build fast, friendly software for the web.',
  about:
    'I’m a software engineer who likes turning fuzzy problems into small, reliable systems. I work across the stack, from interfaces people enjoy to the services behind them.',
  location: 'India · open to remote',
  email: 'hello@siddid.me', // replace with the address you want public
  github: 'https://github.com/Siddid-Soni',
  linkedin: 'https://www.linkedin.com/in/',
  resume: '/resume.pdf',
  skills: [
    { area: 'Frontend', items: ['TypeScript', 'React', 'Astro', 'Three.js'] },
    { area: 'Backend', items: ['Node.js', 'Go', 'PostgreSQL'] },
    { area: 'Infra', items: ['Docker', 'GitHub Actions', 'Linux'] },
  ],
  afterHours: [
    { title: 'Open source', text: 'Small fixes and docs PRs to tools I use every day.' },
    { title: 'Experiments', text: 'Shaders, tiny games and CLI tools built on weekends.' },
    { title: 'This site', text: 'Built with Astro and Three.js. One day in my room.', href: 'https://github.com/Siddid-Soni/Siddid-Soni.github.io' },
  ],
} as const satisfies {
  name: string; role: string; tagline: string; about: string; location: string; email: string;
  github: string; linkedin: string; resume: string;
  skills: readonly { area: 'Frontend' | 'Backend' | 'Infra'; items: readonly string[] }[];
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
