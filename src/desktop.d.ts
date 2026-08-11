export interface HintPayload {
  /** True once one Escape has landed and a second will stop the wall. */
  armed: boolean
  /** How long that second press has, in milliseconds. */
  withinMs: number
}

declare global {
  interface Window {
    /** Present only inside the Electron shell; undefined in a plain browser. */
    swarmdeck?: {
      isDesktop: true
      onHint(callback: (payload: HintPayload) => void): () => void
    }
  }
}
