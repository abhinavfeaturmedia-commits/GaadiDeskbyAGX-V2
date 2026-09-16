/**
 * Node.js helper utility for loading environment variables and configuration for Layer 3 execution scripts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BASE_DIR = path.resolve(__dirname, '..');
export const TMP_DIR = path.resolve(BASE_DIR, '.tmp');
export const ENV_FILE = path.resolve(BASE_DIR, '.env');

export function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
  return TMP_DIR;
}

export function loadEnv(envPath = ENV_FILE) {
  const envVars = {};
  if (!fs.existsSync(envPath)) {
    return envVars;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }
    const [key, ...vals] = trimmed.split('=');
    const val = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
    const cleanKey = key.trim();
    envVars[cleanKey] = val;
    if (!process.env[cleanKey]) {
      process.env[cleanKey] = val;
    }
  }
  return envVars;
}

export function getEnvVar(key, defaultValue = null) {
  loadEnv();
  return process.env[key] || defaultValue;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureTmpDir();
  const loaded = loadEnv();
  console.log(`[OK] Layer 3 environment helper (Node.js) initialized. Loaded ${Object.keys(loaded).length} keys from ${path.basename(ENV_FILE)}.`);
}
