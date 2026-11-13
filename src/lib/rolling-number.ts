export interface NumberCell { key: string; text: string; digit?: number }

/** Place identity keeps carries on the same wheel, independent of formatting. */
export function numberCells(value: string): NumberCell[] {
  const cells: NumberCell[] = []
  let field = 0
  for (const match of value.matchAll(/\d[\d,]*(?:\.\d+)?|[^\d]+/gu)) {
    const token = match[0]
    if (!/^\d/u.test(token)) {
      cells.push({ key: `literal:${field}`, text: token })
      continue
    }
    const [integer = '', fraction] = token.split('.')
    let place = integer.replaceAll(',', '').length
    for (const text of integer) {
      if (text === ',') cells.push({ key: `${field}:group:${place}`, text })
      else cells.push({ key: `${field}:integer:${--place}`, text, digit: Number(text) })
    }
    if (fraction !== undefined) {
      cells.push({ key: `${field}:point`, text: '.' })
      Array.from(fraction).forEach((text, index) => cells.push({ key: `${field}:fraction:${index}`, text, digit: Number(text) }))
    }
    field += 1
  }
  return cells
}
