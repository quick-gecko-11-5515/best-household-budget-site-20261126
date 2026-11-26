// Hearthbook hand-in entrypoint (Node 22 standard library only).
// Copies app/ and screenshots/ into MAKEFUN_OUTPUT_DIR (or /output) and builds dossier.json.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const screenshotsDest = join(outputDir, 'screenshots');
mkdirSync(screenshotsDest, { recursive: true });
const screenshotsSrc = join(repoRoot, 'screenshots');
if (existsSync(screenshotsSrc)) {
  cpSync(screenshotsSrc, screenshotsDest, { recursive: true });
}

const dossierPayload = buildDossier(outputDir, DOSSIER_LIMITS);
writeFileSync(join(outputDir, 'dossier.json'), dossierPayload);
