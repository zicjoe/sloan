import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/bitquery/sync-discovery.mjs'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/bitquery/sync-market.mjs'], { stdio: 'inherit' });
