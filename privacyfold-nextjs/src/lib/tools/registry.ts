import type { GitCmsTool } from '../git-cms';

export const FAMILIES: Record<GitCmsTool['fam'], { name: string; color: string }> = {
  photo: { name: 'Photo & ID', color: '#F5B82E' },
  pdf: { name: 'PDF & Documents', color: '#A33B48' },
  forms: { name: 'Tax & Forms', color: '#F0662B' },
  image: { name: 'Images & Media', color: '#1FAE85' },
  dev: { name: 'Developer & Data', color: '#2E3025' },
  crypto: { name: 'Security & Crypto', color: '#F27AA3' },
};
