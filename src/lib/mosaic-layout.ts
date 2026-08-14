export interface MosaicItem {
  key: string
  type: 'pgm' | 'telemetry' | 'agent' | 'ops'
  preferredAspect: number
  minAspect: number
  maxAspect: number
  weight: number
  minWidth: number
  minHeight: number
  preferredWidth?: number
  preferredHeight?: number
  variants?: readonly MosaicVariant[]
}

export interface MosaicVariant {
  minWidth: number
  minHeight: number
  minAspect: number
  maxAspect: number
}

export interface GridRect { row: number; column: number; rows: number; columns: number }

interface GridRegion extends GridRect {}
interface PackedLayout { rects: Map<string, GridRect>; feasible: boolean; score: number }

const GRID_COLUMNS = 192
const GRID_ROWS = 192
const MAX_STRIPS = 48
const DIMENSION_TOLERANCE = 0.96
const ASPECT_TOLERANCE = 0.96

export function viewportCapacityMetric(viewportWidth: number, viewportHeight: number): number {
  const area = viewportWidth * viewportHeight
  const readableColumns = Math.max(2, Math.floor(viewportWidth / 280))
  const readableRows = Math.max(2, Math.floor(viewportHeight / 145))
  return Math.min(area / 82_000, readableColumns * readableRows)
}

export function targetViewportCapacity(viewportWidth: number, viewportHeight: number): number {
  return Math.max(3, Math.floor(viewportCapacityMetric(viewportWidth, viewportHeight)))
}

function variantFits(variant: MosaicVariant, width: number, height: number, aspect: number): boolean {
  return width >= variant.minWidth * DIMENSION_TOLERANCE
    && height >= variant.minHeight * DIMENSION_TOLERANCE
    && aspect >= variant.minAspect * ASPECT_TOLERANCE
    && aspect <= variant.maxAspect / ASPECT_TOLERANCE
}

function itemFits(item: MosaicItem, width: number, height: number, aspect: number): boolean {
  const variants = item.variants ?? [item]
  return variants.some(variant => variantFits(variant, width, height, aspect))
}

function minimumHeightFor(item: MosaicItem, width: number): number {
  const variants = item.variants ?? [item]
  const candidates = variants.flatMap((variant) => {
    if (width < variant.minWidth * DIMENSION_TOLERANCE) return []
    const minimum = Math.max(variant.minHeight * DIMENSION_TOLERANCE, width * ASPECT_TOLERANCE / variant.maxAspect)
    const maximum = width / (variant.minAspect * ASPECT_TOLERANCE)
    return minimum <= maximum ? [minimum] : []
  })
  return candidates.length ? Math.min(...candidates) : Number.POSITIVE_INFINITY
}

function gapFor(width: number): number {
  return Math.max(5, Math.min(10, width * 0.005))
}

export function dimensionsFor(
  rect: GridRect,
  viewportWidth: number,
  viewportHeight: number,
): { width: number; height: number; aspect: number } {
  const width = viewportWidth * rect.columns / GRID_COLUMNS - gapFor(viewportWidth)
  const height = viewportHeight * rect.rows / GRID_ROWS - gapFor(viewportWidth)
  return { width, height, aspect: width / Math.max(1, height) }
}

export function violationsFor(
  items: MosaicItem[],
  rects: Map<string, GridRect>,
  viewportWidth: number,
  viewportHeight: number,
): string[] {
  return items.flatMap((item) => {
    const rect = rects.get(item.key)
    if (!rect) return [`${item.key}:missing`]
    const { width, height, aspect } = dimensionsFor(rect, viewportWidth, viewportHeight)
    const violations: string[] = []
    if (!itemFits(item, width, height, aspect)) violations.push(`${item.key}:content-fit`)
    return violations
  })
}

function pack(
  items: MosaicItem[],
  columns = GRID_COLUMNS,
  rows = GRID_ROWS,
  viewportWidth = 1,
  viewportHeight = 1,
): PackedLayout {
  if (!items.length) return { rects: new Map(), feasible: true, score: 0 }
  const estimatedGap = gapFor(viewportWidth)
  let best: { score: number; rects: GridRect[]; feasible: boolean } | undefined
  const totalAspect = items.reduce((sum, item) => sum + item.preferredAspect, 0)

  for (let rowCount = 1; rowCount <= Math.min(MAX_STRIPS, items.length); rowCount += 1) {
    const groups: MosaicItem[][] = []
    let cursor = 0
    let remainingAspect = totalAspect
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const remainingRows = rowCount - rowIndex
      const target = remainingAspect / remainingRows
      const group: MosaicItem[] = []
      let aspect = 0
      while (cursor < items.length - (remainingRows - 1)) {
        const next = items[cursor]!
        if (group.length && Math.abs(target - aspect) < Math.abs(target - aspect - next.preferredAspect)) break
        group.push(next)
        aspect += next.preferredAspect
        cursor += 1
      }
      groups.push(group)
      remainingAspect -= aspect
    }
    if (cursor !== items.length || groups.some(group => group.length === 0)) continue

    const naturalHeights = groups.map(group => {
      const rowAspect = group.reduce((sum, item) => sum + item.preferredAspect, 0)
      return viewportWidth / Math.max(0.01, rowAspect)
    })
    const minimumHeights = groups.map((group) => {
      const aspectSum = group.reduce((sum, item) => sum + item.preferredAspect, 0)
      return Math.max(...group.map(item => minimumHeightFor(item, viewportWidth * item.preferredAspect / aspectSum)))
    })
    const minimumTotal = minimumHeights.reduce((sum, height) => sum + height, 0)
    const naturalExtra = naturalHeights.map((height, index) => Math.max(0, height - minimumHeights[index]!))
    const extraTotal = naturalExtra.reduce((sum, height) => sum + height, 0)
    const availableExtra = Math.max(0, viewportHeight - minimumTotal)
    const idealHeights = minimumTotal <= viewportHeight
      ? minimumHeights.map((height, index) => height + (extraTotal ? availableExtra * naturalExtra[index]! / extraTotal : availableExtra / minimumHeights.length))
      : minimumHeights.map(height => height / minimumTotal * viewportHeight)
    let score = 0
    let feasible = true
    const rects: GridRect[] = []
    let y = 0
    groups.forEach((group, groupIndex) => {
      const rowEnd = groupIndex === groups.length - 1 ? rows : Math.round((y + idealHeights[groupIndex]!) / viewportHeight * rows)
      const rowStart = Math.round(y / viewportHeight * rows)
      const rowHeight = Math.max(1, rowEnd - rowStart)
      const aspectSum = group.reduce((sum, item) => sum + item.preferredAspect, 0)
      let x = 0
      group.forEach((item, itemIndex) => {
        const width = viewportWidth * item.preferredAspect / aspectSum
        const columnStart = Math.round(x / viewportWidth * columns)
        const columnEnd = itemIndex === group.length - 1 ? columns : Math.round((x + width) / viewportWidth * columns)
        const contentWidth = width - estimatedGap
        const contentHeight = idealHeights[groupIndex]! - estimatedGap
        const actualAspect = contentWidth / Math.max(1, contentHeight)
        feasible &&= itemFits(item, contentWidth, contentHeight, actualAspect)
        const aspectViolation = actualAspect < item.minAspect
          ? Math.log(item.minAspect / actualAspect)
          : actualAspect > item.maxAspect
            ? Math.log(actualAspect / item.maxAspect)
            : 0
        score += Math.abs(Math.log(actualAspect / item.preferredAspect)) * item.weight * 20
          + aspectViolation * item.weight * 220
          + Math.abs(Math.log(contentWidth / (item.preferredWidth ?? contentWidth))) * item.weight * 5
          + Math.abs(Math.log(contentHeight / (item.preferredHeight ?? contentHeight))) * item.weight * 5
        rects.push({ row: rowStart, column: columnStart, rows: rowHeight, columns: Math.max(1, columnEnd - columnStart) })
        x += width
      })
      y += idealHeights[groupIndex]!
    })
    if (!best || (feasible && !best.feasible) || feasible === best.feasible && score < best.score) {
      best = { score, rects, feasible }
    }
  }

  // Very narrow regions often need one full-width card per row. The strip
  // scorer above starts from preferred horizontal proportions, so keep this
  // deterministic vertical candidate as a hard-fit fallback.
  if (!best?.feasible) {
    const minimumHeights = items.map(item => minimumHeightFor(item, viewportWidth))
    const minimumTotal = minimumHeights.reduce((sum, height) => sum + height, 0)
    if (minimumHeights.every(Number.isFinite) && minimumTotal <= viewportHeight) {
      const extra = viewportHeight - minimumTotal
      const preferredExtra = items.map((item, index) => Math.max(0, (item.preferredHeight ?? minimumHeights[index]!) - minimumHeights[index]!))
      const preferredTotal = preferredExtra.reduce((sum, height) => sum + height, 0)
      const heights = minimumHeights.map((height, index) => height + (preferredTotal ? extra * preferredExtra[index]! / preferredTotal : extra / items.length))
      let y = 0
      const rects = heights.map((height, index) => {
        const row = Math.round(y / viewportHeight * rows)
        y += height
        const rowEnd = index === heights.length - 1 ? rows : Math.round(y / viewportHeight * rows)
        return { row, column: 0, rows: Math.max(1, rowEnd - row), columns }
      })
      const feasible = items.every((item, index) => {
        const contentWidth = viewportWidth - estimatedGap
        const contentHeight = viewportHeight * rects[index]!.rows / rows - estimatedGap
        return itemFits(item, contentWidth, contentHeight, contentWidth / Math.max(1, contentHeight))
      })
      if (feasible) best = { score: 0, rects, feasible: true }
    }
  }

  const rects = new Map(items.map((item, index) => [item.key, best?.rects[index] ?? { row: 0, column: 0, rows, columns }]))
  return { rects, feasible: best?.feasible ?? false, score: best?.score ?? Number.POSITIVE_INFINITY }
}

function packRegion(
  items: MosaicItem[],
  region: GridRegion,
  viewportWidth: number,
  viewportHeight: number,
): PackedLayout {
  const packed = pack(
    items,
    region.columns,
    region.rows,
    viewportWidth * region.columns / GRID_COLUMNS,
    viewportHeight * region.rows / GRID_ROWS,
  )
  return {
    ...packed,
    rects: new Map([...packed.rects].map(([key, rect]) => [key, {
      row: rect.row + region.row,
      column: rect.column + region.column,
      rows: rect.rows,
      columns: rect.columns,
    }])),
  }
}

export function packMosaic(items: MosaicItem[], viewportWidth: number, viewportHeight: number): PackedLayout {
  const pgm = items.find(item => item.type === 'pgm')
  if (!pgm) return pack(items, GRID_COLUMNS, GRID_ROWS, viewportWidth, viewportHeight)
  const rest = items.filter(item => item !== pgm)
  const viewportAspect = viewportWidth / Math.max(1, viewportHeight)
  const pgmArea = items.length <= 7 ? 0.42 : items.length <= 14 ? 0.32 : 0.24
  let pgmColumns: number
  let pgmRows: number
  let regions: GridRegion[]

  if (viewportAspect < 0.82) {
    pgmColumns = GRID_COLUMNS
    const minRows = Math.ceil(pgm.minHeight / viewportHeight * GRID_ROWS)
    pgmRows = Math.max(minRows, Math.min(Math.round(GRID_ROWS * 0.52), Math.round(GRID_ROWS * viewportAspect / pgm.preferredAspect)))
    regions = [{ row: pgmRows, column: 0, rows: GRID_ROWS - pgmRows, columns: GRID_COLUMNS }]
  } else {
    const widthFraction = Math.sqrt(pgmArea * pgm.preferredAspect / viewportAspect)
    const minPgmColumns = Math.ceil(pgm.minWidth / viewportWidth * GRID_COLUMNS)
    const maxPgmColumns = Math.min(Math.round(GRID_COLUMNS * 0.625), Math.floor(1060 / viewportWidth * GRID_COLUMNS))
    const minPgmRows = Math.ceil(pgm.minHeight / viewportHeight * GRID_ROWS)
    const maxPgmRows = Math.round(GRID_ROWS * 0.73)
    pgmColumns = Math.max(minPgmColumns, Math.min(maxPgmColumns, Math.round(widthFraction * GRID_COLUMNS)))
    const pgmPixelWidth = viewportWidth * pgmColumns / GRID_COLUMNS
    pgmRows = Math.max(minPgmRows, Math.min(maxPgmRows, Math.round(pgmPixelWidth / pgm.preferredAspect / viewportHeight * GRID_ROWS)))
    regions = [
      { row: 0, column: pgmColumns, rows: pgmRows, columns: GRID_COLUMNS - pgmColumns },
      { row: pgmRows, column: 0, rows: GRID_ROWS - pgmRows, columns: GRID_COLUMNS },
    ].filter(region => region.rows > 0 && region.columns > 0)
  }

  const pgmRect = { row: 0, column: 0, rows: pgmRows, columns: pgmColumns }
  const result = new Map<string, GridRect>([[pgm.key, pgmRect]])
  const totalArea = regions.reduce((sum, region) => sum + region.rows * region.columns, 0)
  const totalRestWeight = rest.reduce((sum, item) => sum + item.weight, 0)
  const targetWeights = regions.map(region => totalRestWeight * region.rows * region.columns / totalArea)
  const groups = regions.map(() => [] as MosaicItem[])
  const groupWeights = regions.map(() => 0)
  const telemetry = rest.find(item => item.type === 'telemetry')
  const unassigned = rest.filter(item => item !== telemetry)

  if (telemetry) {
    let telemetryRegion = 0
    let bestScore = Number.POSITIVE_INFINITY
    regions.forEach((region, index) => {
      const regionAspect = viewportWidth * region.columns / (viewportHeight * region.rows)
      const rangePenalty = regionAspect < telemetry.minAspect
        ? Math.log(telemetry.minAspect / regionAspect) * 4
        : regionAspect > telemetry.maxAspect
          ? Math.log(regionAspect / telemetry.maxAspect) * 4
          : 0
      const score = rangePenalty + Math.abs(Math.log(regionAspect / telemetry.preferredAspect))
      if (score < bestScore) {
        telemetryRegion = index
        bestScore = score
      }
    })
    groups[telemetryRegion]!.push(telemetry)
    groupWeights[telemetryRegion]! += telemetry.weight
  }

  for (const item of unassigned) {
    let regionIndex = 0
    for (let index = 1; index < regions.length; index += 1) {
      const fill = groupWeights[index]! / Math.max(0.01, targetWeights[index]!)
      const bestFill = groupWeights[regionIndex]! / Math.max(0.01, targetWeights[regionIndex]!)
      if (fill < bestFill) regionIndex = index
    }
    groups[regionIndex]!.push(item)
    groupWeights[regionIndex]! += item.weight
  }

  let feasible = true
  let score = 0
  regions.forEach((region, index) => {
    const packed = packRegion(groups[index]!, region, viewportWidth, viewportHeight)
    feasible &&= packed.feasible
    score += packed.score
    for (const [key, rect] of packed.rects) result.set(key, rect)
  })
  feasible &&= violationsFor(items, result, viewportWidth, viewportHeight).length === 0
  return { rects: result, feasible, score }
}
