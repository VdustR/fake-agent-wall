export interface HintPayload {
  /** Whether Escape is currently being held or the gesture is only being taught. */
  state: 'ready' | 'holding'
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
