// Phase 4 — Move useState declarations before useEffect in StudentProfilePage.tsx
// to fix "Cannot access variable before it is declared" lint errors.

import { readFile, writeFile } from 'node:fs/promises';

const FILE = '/home/z/my-project/src/components/student/StudentProfilePage.tsx';

let content = await readFile(FILE, 'utf8');
const lines = content.split('\n');

// Find the line numbers (1-indexed) of:
// - "  }, [token]);" — end of the useEffect (line 2263 in 1-indexed, 2262 in 0-indexed)
// - "  const [profileCompletion, setProfileCompletion] = useState(45);" — line 2264 (2263 0-indexed)
// - The closing "  });" of the form useState — line 2366 (2365 0-indexed)
// - The useEffect start "// Load profile from API on mount" — around line 2166 (2165 0-indexed)

let useEffectCommentIdx = -1;
let useEffectEndIdx = -1;
let profileCompletionIdx = -1;
let formStartIdx = -1;
let formEndIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i] === '  // Load profile from API on mount' && useEffectCommentIdx === -1) {
    useEffectCommentIdx = i;
  }
  if (lines[i] === '  }, [token]);' && useEffectEndIdx === -1 && useEffectCommentIdx !== -1) {
    useEffectEndIdx = i;
  }
  if (lines[i].includes('const [profileCompletion, setProfileCompletion] = useState(45);') && profileCompletionIdx === -1) {
    profileCompletionIdx = i;
  }
  if (lines[i].includes('const [form, setForm] = useState<Record<string, unknown>>({') && formStartIdx === -1) {
    formStartIdx = i;
  }
  // The form useState ends with `  });` — find the first one after formStartIdx
  if (formStartIdx !== -1 && formEndIdx === -1 && i > formStartIdx && lines[i] === '  });') {
    formEndIdx = i;
  }
}

console.log('useEffect comment idx (0-indexed):', useEffectCommentIdx);
console.log('useEffect end idx:', useEffectEndIdx);
console.log('profileCompletion idx:', profileCompletionIdx);
console.log('form start idx:', formStartIdx);
console.log('form end idx:', formEndIdx);

if (useEffectCommentIdx === -1 || useEffectEndIdx === -1 || profileCompletionIdx === -1 || formStartIdx === -1 || formEndIdx === -1) {
  console.error('Could not find all required lines');
  process.exit(1);
}

if (profileCompletionIdx !== useEffectEndIdx + 1) {
  console.error(`Expected profileCompletion at ${useEffectEndIdx + 1} but found at ${profileCompletionIdx}`);
  process.exit(1);
}

if (formStartIdx !== profileCompletionIdx + 1) {
  console.error(`Expected form start at ${profileCompletionIdx + 1} but found at ${formStartIdx}`);
  process.exit(1);
}

// Extract the lines to move (profileCompletion + form useState, inclusive)
const linesToMove = lines.slice(profileCompletionIdx, formEndIdx + 1);
console.log('Lines to move:', linesToMove.length);

// Remove them from their current position
const withoutMoved = [...lines.slice(0, profileCompletionIdx), ...lines.slice(formEndIdx + 1)];

// Insert them before the useEffect comment
const result = [
  ...withoutMoved.slice(0, useEffectCommentIdx),
  ...linesToMove,
  '',  // blank line separator
  ...withoutMoved.slice(useEffectCommentIdx),
];

await writeFile(FILE, result.join('\n'), 'utf8');
console.log('Done. File updated.');
