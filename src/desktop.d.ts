export interface HintPayload {
  /** Whether the gesture is being taught, timed, or waiting for key release. */
  state: 'ready' | 'holding' | 'armed'
  /** How long Escape must remain held, in milliseconds. */
  holdMs: number
}

declare global {
  interface Window {
    /** Present only inside the Electron shell; undefined in a plain browser. */
    agentWall?: {
      isDesktop: true
      onHint(callback: (payload: HintPayload) => void): () => void
      onThemeToggle(callback: () => void): () => void
      onThemeClose(callback: () => void): () => void
      setThemePanelOpen(open: boolean): void
    }
  }
}
