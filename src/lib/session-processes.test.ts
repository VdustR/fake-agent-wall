import { expect, it } from 'vitest'
import { Agent } from './agent.svelte'
import { Swarm } from './swarm.svelte'

it('does not turn prefilled transcript history into currently running tool processes', () => {
  const swarm = new Swarm()
  expect(swarm.agents.every(agent => agent.activeTool === null)).toBe(true)
  expect(swarm.host.processes.some(process => process.command.startsWith('agent-worker'))).toBe(false)
  expect(swarm.host.processes.some(process => process.role === 'worker')).toBe(false)
})

it('publishes a tool execution only after its call commits and ends it with the result', () => {
  const agent = new Agent(3, 42)
  let now = performance.now()
  let observed = false
  let ended = false
  let execution = 0
  for (let step = 0; step < 2000; step++) {
    now += 50
    agent.tick(now, 50)
    if (!observed && agent.activeTool) {
      observed = true
      execution = agent.activeTool.id
      expect(agent.activeTool.id).toBe(agent.lastEvent?.n)
      expect(agent.lines.findLast(line => line.k === 'tool')?.s).toContain(agent.activeTool.descriptor.command)
    } else if (observed && agent.activeTool?.id !== execution) {
      ended = true
      break
    }
  }
  expect(observed).toBe(true)
  expect(ended).toBe(true)
})

it('derives published tool rows from the same active executions as the sessions', () => {
  const swarm = new Swarm()
  let now = performance.now()
  let previous = swarm.host
  let observed = 0
  const activePids = new Map<number, { slot: number; run: number }>()
  let retired = 0
  for (let step = 0; step < 600; step++) {
    now += 100
    swarm.frame(now, 100)
    if (swarm.host === previous) continue
    previous = swarm.host
    const pids = new Set(swarm.host.processes.map(process => process.pid))
    for (const [pid, owner] of activePids) {
      const agent = swarm.agents.find(candidate => candidate.slot === owner.slot)
      if (agent?.activeTool?.id !== owner.run) {
        expect(pids.has(pid)).toBe(false)
        activePids.delete(pid)
        retired++
      }
    }
    for (const process of swarm.host.processes.filter(candidate => candidate.role === 'worker')) {
      const agent = swarm.agents.find(candidate => candidate.slot === process.sessionSlot)
      expect(agent?.activeTool?.id).toBe(process.toolRunId)
      expect(agent?.activeTool?.descriptor.command).toBe(process.toolCommand)
      activePids.set(process.pid, { slot: process.sessionSlot!, run: process.toolRunId! })
      observed++
    }
  }
  expect(observed).toBeGreaterThan(0)
  expect(retired).toBeGreaterThan(0)
})
