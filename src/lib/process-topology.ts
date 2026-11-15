import type { ToolExecution } from './tool-workload'

interface Worker {
  command: string
  cpuWeight: number
  rssWeight: number
  maxCpu: number
}
const worker = (command: string, cpuWeight = 1, rssWeight = 1, maxCpu = Number.POSITIVE_INFINITY): Worker => ({ command, cpuWeight, rssWeight, maxCpu })

/** Representative local OS processes, not remote servers or individual threads. */
export function processWorkers(run: ToolExecution, repo: string): Worker[] {
  const { descriptor } = run
  const command = descriptor.command
  if (!descriptor.shell && descriptor.profile !== 'search') return []
  const crate = repo.replace(/[^a-zA-Z0-9_]/g, '_')
  if (descriptor.profile === 'rust') return [
    worker(`rustc --crate-name ${crate}`, 1.8, 2),
    worker('rustc --crate-name serde', .7, .6),
    worker('rustc --crate-name tokio', 1.1, 1),
  ]
  if (descriptor.profile === 'go') return [worker(`compile [${repo}]`, 1.7, 1.5), worker('compile [dependencies]', .8, .7)]
  if (descriptor.profile === 'docker') return [worker('buildkit-runc [build stage]')]
  if (descriptor.profile === 'test') {
    // libtest uses threads inside one test binary; do not invent OS workers.
    if (/^cargo test\b/.test(command)) return [worker(`target/debug/deps/${crate}-tests`)]
    if (/^go test\b/.test(command)) return [worker(`${repo}.test`, 1.6, 1.3), worker('internal.test', .6, .7)]
    if (/playwright\b/.test(command) && /--project[= ]chromium\b/.test(command)) return [
      worker('node playwright [test worker]', .7, .8),
      worker('chromium --headless', .3, 1),
      worker('chromium --type=renderer', 1.8, 1.6),
      worker('chromium --type=gpu-process', .2, .6),
    ]
    const executable = /pytest\b/.test(command) ? 'python -m pytest' : /playwright\b/.test(command) ? 'node playwright' : 'node vitest'
    return [worker(`${executable} [worker 1]`, 1.5, 1.3, 100), worker(`${executable} [worker 2]`, .9, 1, 100), worker(`${executable} [worker 3]`, .6, .7, 100)]
  }
  if (/^git (?:clone|fetch|pull)\b/.test(command)) return [worker(command, .3, .5), worker('git index-pack --stdin', 1.7, 1.5)]
  return [worker(descriptor.executable)]
}
