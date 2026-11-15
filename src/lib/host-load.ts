/** A fictional host profile; never inferred from the viewer's device. */
export const HOST_PROFILE = { logicalCpus: 16, memoryGiB: 64, storageGiB: 2048, diskMiBs: 800, networkMbps: 1000 } as const
export const HOST_SAMPLE_MS = 250
export const HOST_HISTORY_SAMPLES = 128
export interface HostLoad {
  cpu: number
  memoryGiB: number
  storageGiB: number
  diskRead: number
  diskWrite: number
  netRx: number
  netTx: number
}
export interface SimulatedProcess {
  pid: number
  parentPid?: number
  role: 'agent' | 'launcher' | 'worker' | 'service'
  state: 'R' | 'S' | 'D'
  cpu: number
  rssMiB: number
  command: string
  sessionSlot?: number
  sessionLabel?: string
  repo?: string
  toolRunId?: number
  toolCommand?: string
}
export interface HostSnapshot {
  sampledAtMs: number
  load: HostLoad
  cores: number[]
  processes: SimulatedProcess[]
}

export function emptyHostSnapshot(): HostSnapshot {
  return {
    sampledAtMs: 0, cores: Array<number>(HOST_PROFILE.logicalCpus).fill(0), processes: [],
    load: { cpu: 0, memoryGiB: 8, storageGiB: 1184, diskRead: 0, diskWrite: 0, netRx: 0, netTx: 0 },
  }
}

interface HostTrafficSource {
  phase: 'fetch' | 'compile' | 'test' | 'publish' | 'cleanup' | 'idle'
  read: number
  write: number
  rx: number
  tx: number
}

/** Link throttling must also throttle the disk work caused by that payload. */
export function constrainHostTraffic(jobs: readonly HostTrafficSource[]) {
  const rx = jobs.reduce((sum, job) => sum + job.rx, 0)
  const tx = jobs.reduce((sum, job) => sum + job.tx, 0)
  const rxScale = Math.min(1, HOST_PROFILE.networkMbps / Math.max(1, rx))
  const txScale = Math.min(1, HOST_PROFILE.networkMbps / Math.max(1, tx))
  const read = jobs.reduce((sum, job) => sum + job.read * (job.phase === 'publish' ? txScale : 1), 0)
  const write = jobs.reduce((sum, job) => sum + job.write * (job.phase === 'fetch' ? rxScale : 1), 0)
  const diskScale = Math.min(1, HOST_PROFILE.diskMiBs / Math.max(1, read + write))
  const diskRead = read * diskScale
  return {
    netRx: Math.min(HOST_PROFILE.networkMbps, rx),
    netTx: Math.min(HOST_PROFILE.networkMbps, tx),
    diskRead,
    diskWrite: Math.min(write * diskScale, HOST_PROFILE.diskMiBs - diskRead),
  }
}
