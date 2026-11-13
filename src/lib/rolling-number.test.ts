import { describe, expect, it } from 'vitest'
import { numberCells } from './rolling-number'

const digits = (value: string) => numberCells(value).filter(cell => cell.digit !== undefined)

describe('rolling number identity', () => {
  it('keeps the units wheel when an integer gains or loses a digit', () => {
    expect(digits('9').at(-1)?.key).toBe(digits('10').at(-1)?.key)
    expect(digits('100').at(-1)?.key).toBe(digits('99').at(-1)?.key)
  })

  it('anchors integer places across grouping separators', () => {
    expect(digits('999').map(cell => cell.key)).toEqual(digits('1,000').slice(-3).map(cell => cell.key))
  })

  it('keeps integer and fraction wheels when precision changes', () => {
    const short = digits('$1.9')
    const long = digits('$1.90')
    expect(short.map(cell => cell.key)).toEqual(long.slice(0, 2).map(cell => cell.key))
  })

  it('preserves formatted values and keeps independent clock fields distinct', () => {
    for (const value of ['$1,024.50', '01:59:09', '23/26', '-0.5k', '12% fs', 'Infinity']) {
      const cells = numberCells(value)
      expect(cells.map(cell => cell.text).join('')).toBe(value)
      expect(new Set(cells.map(cell => cell.key)).size).toBe(cells.length)
    }
  })
})
