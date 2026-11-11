import { execSync } from 'node:child_process';

let dateMapCache: Map<string, string> | null = null;

function loadGitDateMap(): Map<string, string> {
  if (dateMapCache) return dateMapCache;

  const map = new Map<string, string>();
  const fallbackDate = new Date().toISOString().split('T')[0];

  try {
    const stdout = execSync('git log --name-only --format="COMMIT:%cI" content/', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let currentDate = fallbackDate;
    for (const line of stdout.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('COMMIT:')) {
        currentDate = trimmed.replace('COMMIT:', '').split('T')[0];
      } else {
        if (!map.has(trimmed)) {
          map.set(trimmed, currentDate);
        }
      }
    }
  } catch (e) {
    // Fallback if git is unavailable in a bare environment
  }

  dateMapCache = map;
  return map;
}

export function getGitLastMod(relativeFilePath: string): string {
  const map = loadGitDateMap();
  const normalized = relativeFilePath.replace(/^\.\//, '');
  return map.get(normalized) || new Date().toISOString().split('T')[0];
}
