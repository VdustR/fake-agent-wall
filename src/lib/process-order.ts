import type { SimulatedProcess } from './host-load'

/** Insert new work immediately, retire exits, and keep existing rows stable. */
export function reconcileProcessOrder(previous: readonly number[], processes: readonly SimulatedProcess[], resort: boolean): number[] {
  const byPid = new Map(processes.map(process => [process.pid, process]))
  const descending = (a: number, b: number) => byPid.get(b)!.cpu - byPid.get(a)!.cpu || a - b
  if (resort) return processes.map(process => process.pid).toSorted(descending)
  const order = previous.filter(pid => byPid.has(pid))
  const retained = new Set(order)
  const joined = processes.filter(process => !retained.has(process.pid)).map(process => process.pid).toSorted(descending)
  for (const pid of joined) {
    const index = order.findIndex(other => descending(pid, other) < 0)
    if (index < 0) order.push(pid)
    else order.splice(index, 0, pid)
  }
  return order
}
