const MAX_SIMULATED_DISPLAYS = 8
const SIMULATION_GAP = 16

export function parseSimulatedDisplayCount(value) {
  if (value === undefined || value === '') return 0
  const count = Number(value)
  return Number.isInteger(count) && count >= 2 && count <= MAX_SIMULATED_DISPLAYS ? count : 0
}

export function realDisplayTargets(displays) {
  return displays.map(({ id, bounds }) => ({
    key: String(id),
    bounds: { ...bounds },
  }))
}

export function simulatedDisplayTargets(workArea, count) {
  const columns = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / columns)
  const width = Math.floor((workArea.width - SIMULATION_GAP * (columns - 1)) / columns)
  const height = Math.floor((workArea.height - SIMULATION_GAP * (rows - 1)) / rows)

  return Array.from({ length: count }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    return {
      key: `simulated-${index + 1}`,
      bounds: {
        x: workArea.x + column * (width + SIMULATION_GAP),
        y: workArea.y + row * (height + SIMULATION_GAP),
        width,
        height,
      },
    }
  })
}

export function planDisplayReconciliation(existing, targets) {
  const desired = new Map(targets.map(target => [target.key, target]))
  const remove = [...existing]
    .filter(([key, bounds]) => !desired.has(key) || !sameBounds(bounds, desired.get(key).bounds))
    .map(([key]) => key)
  const removed = new Set(remove)
  const create = targets.filter(target => !existing.has(target.key) || removed.has(target.key))
  return { remove, create }
}

function sameBounds(left, right) {
  return left.x === right.x && left.y === right.y
    && left.width === right.width && left.height === right.height
}
