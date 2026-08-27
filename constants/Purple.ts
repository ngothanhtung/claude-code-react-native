/**
 * "10 Shades of Purple" brand preset — royal & timeless purple ramp.
 * Source of truth for primary/accent colors across the app (buttons,
 * FABs, active tab, toggles, links). Category/label colors (project
 * dots, avatars) stay outside this ramp on purpose.
 */
const Purple = {
  royalPurple: '#3B0764',
  deepPurple: '#4C1D95',
  amethystPurple: '#6D28D9',
  purpleViolet: '#7C3AED',
  grapePurple: '#8B5CF6',
  lavenderPurple: '#A78BFA',
  lilacPurple: '#C4B5FD',
  pastelPurple: '#DDD6FE',
  mauvePurple: '#EDE1F5',
  wisteriaPurple: '#F5EEFB',
};

export default Purple;

export const PurpleTheme = {
  primary: Purple.deepPurple,
  primaryStrong: Purple.royalPurple,
  primarySoft: Purple.pastelPurple,
  primaryMist: Purple.wisteriaPurple,
};
