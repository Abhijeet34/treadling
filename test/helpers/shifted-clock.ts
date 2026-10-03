// SPDX-License-Identifier: Apache-2.0
// Moves the product's system clock to `TREADLING_TEST_AT` for the life of one process, so the
// suite can be run as if it were any instant, a month's last second included. Loaded through
// NODE_OPTIONS by `scripts/test-at.ts`, which is how every process the suite spawns starts there
// too. `Date.now` is left alone: the lock judges staleness against real file mtimes.

import { systemClock } from '../../src/adapters/clock.ts'

const at = process.env['TREADLING_TEST_AT']
if (at !== undefined) {
  const offset = Date.parse(at) - Date.now()
  Object.assign(systemClock, { now: () => `${new Date(Date.now() + offset).toISOString().slice(0, 19)}Z` })
}
