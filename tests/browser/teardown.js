import { rm } from 'node:fs/promises';
import { basename } from 'node:path';

export default async function teardown() {
  const directory = process.env.CREATOR_E2E_AUTH_DIR;
  if (directory && basename(directory).startsWith('creator-e2e-')) await rm(directory, { recursive: true, force: true });
}
