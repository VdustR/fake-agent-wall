export function updateTrayMenu(tray, menu, isMac) {
  if (!isMac) tray.setContextMenu(menu)
  return menu
}

export function openTrayMenu(tray, menu) {
  tray.popUpContextMenu(menu)
}
