const pad = (value: number, width = 2) => String(value).padStart(width, '0')

/** Local system time, sampled independently of the simulation's elapsed time. */
export function formatLocalTime(timestamp: number): string {
  const date = new Date(timestamp)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

/** One sample per paint; a delayed frame reads now rather than replaying missed ticks. */
export function observeWallClock(changed: (timestamp: number) => void): () => void {
  let frame = 0
  const paint = () => {
    changed(Date.now())
    frame = window.requestAnimationFrame(paint)
  }
  const resync = () => {
    window.cancelAnimationFrame(frame)
    frame = 0
    if (!document.hidden) paint()
  }
  document.addEventListener('visibilitychange', resync)
  window.addEventListener('pageshow', resync)
  resync()
  return () => {
    window.cancelAnimationFrame(frame)
    document.removeEventListener('visibilitychange', resync)
    window.removeEventListener('pageshow', resync)
  }
}
