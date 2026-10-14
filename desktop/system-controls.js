/** Hardware controls remain available even if Chromium delivers their events. */
export function isHardwareControl(input) {
  return ['AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute', 'BrightnessUp', 'BrightnessDown']
    .includes(input.key)
}
