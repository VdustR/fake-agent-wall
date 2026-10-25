const assert = require('node:assert/strict')

const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const evaluate = (wall, expression) => wall.webContents.executeJavaScript(expression)

async function idle(wall) {
  // Fullscreen entry can deliver a late pointer event on CI. Observe the
  // eventual state instead of assuming every native event arrived before a sleep.
  // Unit tests separately enforce the exact 2600ms interval and timer reset.
  await evaluate(wall, `new Promise((resolve, reject) => {
    const deck = document.querySelector('.deck')
    const observer = new MutationObserver(check)
    const timeout = setTimeout(() => {
      observer.disconnect()
      reject(new Error('Pointer did not become idle within 8 seconds'))
    }, 8000)
    function check() {
      if (!deck.classList.contains('cursor-idle')) return
      clearTimeout(timeout)
      observer.disconnect()
      resolve()
    }
    observer.observe(deck, { attributes: true, attributeFilter: ['class'] })
    check()
  })`)
}

async function panel(wall, open) {
  wall.webContents.send(open ? 'wall:theme-toggle' : 'wall:theme-close')
  await pause(80)
  assert.equal(await evaluate(wall, `!!document.querySelector('.theme-panel')`), open)
}

async function move(wall, selector) {
  const point = await evaluate(wall, `(() => {
    const rect = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect()
    return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) }
  })()`)
  wall.webContents.sendInputEvent({ type: 'mouseMove', ...point })
  await pause(80)
  assert.equal(await evaluate(wall, `document.querySelector('.deck').classList.contains('cursor-idle')`), false)
}

async function snapshot(wall) {
  return evaluate(wall, `(() => {
    const style = selector => {
      const element = document.querySelector(selector)
      return element ? getComputedStyle(element).cursor : null
    }
    return {
      wall: style('.deck'), panel: style('.theme-panel'),
      button: style('.theme-panel .close'), input: style('#wall-label'),
    }
  })()`)
}

exports.verifyCursor = async function verifyCursor(wall) {
  // Real Chromium input on the focused production window, using its preload
  // and compiled CSS. Keep these transitions sequential: each depends on the last.
  await move(wall, '.wall')
  assert.notEqual((await snapshot(wall)).wall, 'none')
  await idle(wall)
  assert.equal((await snapshot(wall)).wall, 'none')

  // Opening settings while idle must not create a permanently visible island.
  await panel(wall, true)
  assert.deepEqual(await snapshot(wall), { wall: 'none', panel: 'none', button: 'none', input: 'none' })
  await move(wall, '#wall-label')
  assert.deepEqual(await snapshot(wall), { wall: 'auto', panel: 'default', button: 'pointer', input: 'text' })
  await idle(wall)
  assert.deepEqual(await snapshot(wall), { wall: 'none', panel: 'none', button: 'none', input: 'none' })
  await move(wall, '.theme-panel .close')
  assert.equal((await snapshot(wall)).button, 'pointer')
  await move(wall, '.status')
  assert.notEqual((await snapshot(wall)).wall, 'none')

  await panel(wall, false)
  await panel(wall, true)
  await panel(wall, false)
  await panel(wall, true)
  await idle(wall)
  assert.deepEqual(await snapshot(wall), { wall: 'none', panel: 'none', button: 'none', input: 'none' })
  await move(wall, '.theme-panel .close')
  await panel(wall, false)
}
