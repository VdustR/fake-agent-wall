// Match the exit hint's 2.6-second settling time so the wall returns to ambient
// playback promptly, while leaving time to locate a settings control.
export const POINTER_IDLE_MS = 2600

export function observePointerIdle(target: EventTarget, onIdleChange: (idle: boolean) => void): () => void {
  let timer: ReturnType<typeof setTimeout>

  const onMove = () => {
    onIdleChange(false)
    clearTimeout(timer)
    timer = setTimeout(() => onIdleChange(true), POINTER_IDLE_MS)
  }

  // Capture also covers controls that stop pointer events from bubbling.
  target.addEventListener('pointermove', onMove, { capture: true, passive: true })
  onMove()

  return () => {
    clearTimeout(timer)
    target.removeEventListener('pointermove', onMove, { capture: true })
  }
}
