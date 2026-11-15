import { expect, it } from 'vitest'
import { DECISION_MODELS, DECISION_SCENES, MODELS } from './corpus'
import { PROVIDERS } from './operations.svelte'

it('keeps catalog identities unique and every provider readout tied to a session model', () => {
  const labels = MODELS.map(model => model.name)
  expect(new Set(labels).size).toBe(labels.length)
  for (const provider of PROVIDERS) expect(labels).toContain(provider.model)
  const routes = DECISION_MODELS.map(model => `${model.provider}/${model.name}`)
  expect(new Set(routes).size).toBe(routes.length)
})

it('keeps synthetic choice and rubric distributions normalized and binary values bounded', () => {
  for (const scene of DECISION_SCENES) {
    for (const options of [scene.choices, scene.review]) {
      expect(options.length).toBeGreaterThan(1)
      expect(new Set(options.map(option => option.label)).size).toBe(options.length)
      expect(options.every(option => option.probability >= 0 && option.probability <= 1)).toBe(true)
      expect(options.reduce((sum, option) => sum + option.probability, 0)).toBeCloseTo(1, 10)
    }
    expect(scene.yesProbability).toBeGreaterThanOrEqual(0)
    expect(scene.yesProbability).toBeLessThanOrEqual(1)
  }
})
