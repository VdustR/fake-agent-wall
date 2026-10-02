import { describe, expect, it } from 'vitest'
import { isHardwareControl } from './system-controls.js'

describe('hardware control exceptions', () => {
  it('preserves volume, mute, and brightness input', () => {
    for (const key of ['AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute', 'BrightnessUp', 'BrightnessDown']) {
      expect(isHardwareControl({ key, type: 'keyDown' })).toBe(true)
      expect(isHardwareControl({ key, type: 'keyUp' })).toBe(true)
    }
  })

  it('keeps ordinary input and Escape on the existing wall input path', () => {
    for (const key of ['Escape', 'Tab', 'q', 'h', 'F1', 'F12']) {
      expect(isHardwareControl({ key })).toBe(false)
    }
  })
})
