import { app } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Settings live in one small JSON file under userData. There is no migration
 * story on purpose: unknown keys are dropped and missing keys fall back, so a
 * file written by an older build can never wedge the app.
 */
const DEFAULTS = {
  /** Start the wall automatically once the Mac has been idle this long. */
  idleStart: true,
  idleMinutes: 5,
  /** 'playing' keeps the display awake only while the wall is up. */
  keepAwake: 'playing',
  launchAtLogin: false,
}

const FILE = () => join(app.getPath('userData'), 'settings.json')

let cache = null

export function getSettings() {
  if (cache) return cache
  let onDisk = {}
  try {
    onDisk = JSON.parse(readFileSync(FILE(), 'utf8'))
  } catch {
    // First run, or a file we cannot parse. Defaults are the recovery path.
  }
  cache = normalise({ ...DEFAULTS, ...onDisk })
  return cache
}

export function setSettings(patch) {
  cache = normalise({ ...getSettings(), ...patch })
  try {
    writeFileSync(FILE(), `${JSON.stringify(cache, null, 2)}\n`)
  } catch (err) {
    console.error('[fake-agent-wall] could not persist settings:', err)
  }
  return cache
}

function normalise(s) {
  return {
    idleStart: Boolean(s.idleStart),
    // One minute floor: anything shorter fires while you are still reading.
    idleMinutes: clamp(Math.round(Number(s.idleMinutes) || DEFAULTS.idleMinutes), 1, 120),
    keepAwake: ['playing', 'always', 'never'].includes(s.keepAwake) ? s.keepAwake : DEFAULTS.keepAwake,
    launchAtLogin: Boolean(s.launchAtLogin),
  }
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

export { DEFAULTS }
