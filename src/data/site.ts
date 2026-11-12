// Everything you'd want to edit on the About, Contact, and Media screens lives here.
// Projects live in src/content/projects (one markdown file each).

export type ModelKind = 'gear' | 'logo' | 'phone' | 'cartridge' | 'tv' | 'controller' | 'ipod';

// Home menu (desktop): the 3D object that floats on the screen while each line is highlighted.
// Stand-in kinds: gear, phone, cartridge, tv. For your own, drop a .glb in public/models/ and set `file`.
export const menuModels: Record<'about' | 'projects' | 'media' | 'contact', { kind: ModelKind; file?: string; rotate?: [number, number, number]; tint?: string; textures?: string }> = {
  about: { kind: 'logo' },
  projects: { kind: 'cartridge', file: 'cd.fbx', rotate: [-70, 0, 0], textures: 'cd-textures' },
  // rotate = degrees [x, y, z] to turn a model that loads sideways or upside down. textures = a folder under public/models/ holding base.jpg, emissive.jpg, normal.jpg, orm.jpg for a model that came without textures.
  // (tint: '#rrggbb' is a plain-color fallback for the same case.)
  media: { kind: 'tv', file: 'crt.glb', rotate: [0, 0, 180], textures: 'crt' },
  contact: { kind: 'phone', file: 'old-phone-web.glb' },
};

// Projects screen: one entry per category. A project joins a category with `category: <key>` in its
// markdown file. `model` works like the home menu models. Colours drive that category's whole look
// (accent, accent2 and onAccent set the bars, glow and text; bg is the two-stop background field).
export const projectCategories: {
  key: string;
  label: string;
  accent: string;
  accent2: string;
  onAccent: string;
  bg: [string, string];
  theme: 'xbox' | 'ipod'; // which look the screen takes on (see "Projects themes" in global.css)
  model: { kind: ModelKind; file?: string; rotate?: [number, number, number]; tint?: string; textures?: string; sway?: boolean };
}[] = [
  {
    key: 'games',
    label: 'Games',
    accent: '#b9d12a', // olive-lime: highlight bar, buttons
    accent2: '#46d836', // bright green: glow, mesh, outlines
    onAccent: '#0b2a07', // dark text on the highlight bar
    bg: ['#04200a', '#0b3a10'], // near-black green field
    theme: 'xbox',
    model: { kind: 'controller' }, // procedural stand-in; add `file: 'controller.glb'` to use a real model
  },
  {
    key: 'music',
    label: 'Music',
    accent: '#2f7de1', // blue highlight bar
    accent2: '#9aa3b2', // silver: glow, mesh, outlines
    onAccent: '#ffffff',
    bg: ['#f4f6f9', '#d5dae2'], // white to light silver
    theme: 'ipod',
    model: { kind: 'ipod', sway: true },
  },
];

export const site = {
  name: 'Austin Devereux Jr.',

  about: {
    headline: 'I build software, games, art, and music.',
    paragraphs: [
      "I'm a college student heading into IT, and I like building things end to end: software, AI products, automation, and the product decisions behind them.",
      'This site works like a factory floor. Early ideas show up as prototypes, things I am actively building sit in production, and finished work ships.',
      'Press Esc or the Menu button to get back to the main menu.',
    ],
    // The 3D object beside the About text. `kind` picks the built-in stand-in ('gear' or 'phone').
    // To use your own model, drop a .glb in public/models/ and set `file: 'yourmodel.glb'`.
    model: { kind: 'logo' as ModelKind, tag: 'Specimen 01', label: 'AD monogram', file: undefined as string | undefined },
  },

  contact: {
    intro: 'Want to talk, collaborate, or just say hi? Open a line.',
    model: { kind: 'phone' as ModelKind, tag: 'Specimen 02', label: 'Rotary telephone', file: 'old-phone-web.glb' as string | undefined },
    links: [
      { label: 'GitHub', text: 'github.com/devxaustin', href: 'https://github.com/devxaustin' },
      { label: 'LinkedIn', text: 'linkedin.com/in/austin-devereux-jr-0a05a52b7', href: 'https://www.linkedin.com/in/austin-devereux-jr-0a05a52b7' },
      // Add more. An email link looks like:
      // { label: 'Email', text: 'you@example.com', href: 'mailto:you@example.com' },
    ],
  },
};

// Media screen: each entry is one TV channel. `youtube` is the video ID, the part after
// "watch?v=" in a YouTube link. Order here is channel order.
export const channels = [
  { title: 'Featured video', youtube: '3B2hVhSHd-s' },
  // Stand-ins (Blender Foundation open movies). Replace with your own videos.
  { title: 'Sintel (stand-in)', youtube: 'eRsGyueVLvQ' },
  { title: 'Tears of Steel (stand-in)', youtube: 'R6MlUcmOul8' },
];
