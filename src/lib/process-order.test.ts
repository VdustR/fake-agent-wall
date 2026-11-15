import { expect, it } from 'vitest'
import { reconcileProcessOrder } from './process-order'
import type { SimulatedProcess } from './host-load'
const process = (pid: number, cpu: number): SimulatedProcess => ({ pid, cpu, role: 'worker', state: 'R', rssMiB: 10, command: 'worker' })
it('shows new busy tasks immediately and removes exited PIDs', () => {
  expect(reconcileProcessOrder([1, 2], [process(2, 1), process(3, 80)], false)).toEqual([3, 2])
})
it('keeps existing rows stable until the next sort', () => {
  const processes = [process(1, 1), process(2, 90)]
  expect(reconcileProcessOrder([1, 2], processes, false)).toEqual([1, 2])
  expect(reconcileProcessOrder([1, 2], processes, true)).toEqual([2, 1])
})
