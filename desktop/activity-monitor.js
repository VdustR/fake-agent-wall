import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { app } from 'electron'

const execFileAsync = promisify(execFile)
const EMPTY_ACTIVITY = Object.freeze({ audioPlaying: false, cameraInUse: false, fullScreen: false })
const HELPER_TIMEOUT_MS = 1500
let reportedError = false

function helperPath() {
  return app.isPackaged
    ? join(process.resourcesPath, 'activity-monitor')
    : join(import.meta.dirname, 'bin', 'activity-monitor')
}

export async function getSystemActivity() {
  if (process.platform !== 'darwin') return EMPTY_ACTIVITY

  try {
    const { stdout } = await execFileAsync(helperPath(), [], {
      encoding: 'utf8',
      timeout: HELPER_TIMEOUT_MS,
      windowsHide: true,
    })
    const value = JSON.parse(stdout)
    reportedError = false
    return {
      audioPlaying: value.audioPlaying === true,
      cameraInUse: value.cameraInUse === true,
      fullScreen: value.fullScreen === true,
    }
  } catch (err) {
    if (!reportedError) {
      reportedError = true
      console.error('[fake-agent-wall] could not inspect system activity:', err)
    }
    return EMPTY_ACTIVITY
  }
}
