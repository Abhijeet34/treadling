#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Runs the suite with the system clock starting at a given instant in every process, which is
// how a test that names a month by hand is found before the calendar finds it.
//
// Usage: npm run test:at -- <instant> [node --test arguments]
//   npm run test:at -- 2026-12-31T23:59:59Z
//   npm run test:at -- 2026-09-30T23:59:59Z test/services/doctor-blind-spots.test.ts

import { spawnSync } from 'node:child_process'

const [at, ...rest] = process.argv.slice(2)

if (at === undefined || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at) || Number.isNaN(Date.parse(at))) {
  console.error(`usage: npm run test:at -- <YYYY-MM-DDTHH:MM:SSZ> [node --test arguments]; got ${at}`)
  process.exit(2)
}

const preload = new URL('../test/helpers/shifted-clock.ts', import.meta.url).href
const result = spawnSync(
  process.execPath,
  ['--test', '--test-timeout=600000', ...(rest.length > 0 ? rest : ['test/**/*.test.ts'])],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      TREADLING_TEST_AT: at,
      NODE_OPTIONS: `${process.env['NODE_OPTIONS'] ?? ''} --import=${preload}`.trim(),
    },
  },
)
process.exit(result.status ?? 1)
