// SPDX-License-Identifier: Apache-2.0
// Drives the CLI the way the entry point does, with the streams, the environment, the TTY
// test and the clock as arguments. No process is spawned: `run` takes all of them, so a suite
// reads what a command wrote without paying for a fork per assertion.
//
// The clock defaults to the demo's fixed instant rather than the system one, because a write
// lands in the shard and log named for the month it was made in: on the system clock every
// test naming `2026-09` went red the day October began.

import type { Clock } from '../../src/application/ports/clock.ts'
import { fixedClock } from '../../src/adapters/clock.ts'
import { run, type Environment } from '../../src/cli/main.ts'
import { NOW } from './cli-fixtures.ts'

/** The month every write through `runCli` is filed under, which names its shard and its log. */
export const MONTH = NOW.slice(0, 7)

export type Run = {
  readonly code: number
  readonly out: string
  readonly err: string
}

export type RunOptions = {
  readonly cwd?: string
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly isTTY?: boolean
  readonly nodeVersion?: string
  readonly clock?: Clock
}

export async function runCli(argv: readonly string[], options: RunOptions = {}): Promise<Run> {
  let out = ''
  let err = ''
  const environment: Environment = {
    argv,
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? { TREADLING_ACTOR: 'dana' },
    isTTY: options.isTTY ?? false,
    nodeVersion: options.nodeVersion ?? process.versions.node,
    streams: { out: (text) => { out += text }, err: (text) => { err += text } },
    clock: options.clock ?? fixedClock(NOW),
  }
  const code = await run(environment)
  return { code, out, err }
}
