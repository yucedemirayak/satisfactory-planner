/**
 * Independent check of src/data/exampleProject.json: recompute the production
 * balance exactly like the app (balance.ts + calc.ts, configs included), then
 * validate the plan structurally (placements, nodes, wiring, ports) and the
 * POWER balance (generator MW vs machine draw, like power.ts).
 *
 * PASS criteria: every row nets > 0, every product row is produced at
 * >= 1/min ("min 1 adet"), power production >= consumption > 0, zero
 * structural problems, and no legacy power artefacts (prod__power / Burn
 * recipes / generator-shaped workbenches) in the catalogue.
 *
 * Run: node scripts/verify-example-project.cjs
 */
const path = require('path')
const project = require(path.resolve(__dirname, '../src/data/exampleProject.json'))
const d = project.data

const TIER = { 1: 1, 2: 2, 3: 4 }
const PURITY = { impure: 0.5, normal: 1, pure: 2 }
const POWER_EXP = Math.log2(2.5)
const recipeById = new Map(d.recipes.items.map((r) => [r.id, r]))
const extById = new Map(d.extractors.items.map((e) => [e.id, e]))
const wbById = new Map(d.workbenches.items.map((w) => [w.id, w]))
const genById = new Map(d.generators.items.map((g) => [g.id, g]))
const name = (id) =>
  d.products.items.find((p) => p.id === id)?.name ??
  d.materials.items.find((m) => m.id === id)?.name ?? id

// placementFactors mirror (sloops are all 0 in the example).
const factors = (p) => {
  const grouped = p.configs.reduce((s, c) => s + c.count, 0)
  let f = Math.max(0, p.quantity - grouped)
  for (const c of p.configs) f += c.count * (c.clock / 100)
  return f
}
// placementPowerFactor mirror (no sloops in the example → amp = 1).
const powerFactor = (p) => {
  const grouped = p.configs.reduce((s, c) => s + c.count, 0)
  let f = Math.max(0, p.quantity - grouped)
  for (const c of p.configs) f += c.count * (c.clock / 100) ** POWER_EXP
  return f
}

const produced = new Map()
const consumed = new Map()
let mwProduction = 0
let mwConsumption = 0
const allPlacements = Object.values(d.placements.byFloor).flat()

for (const p of allPlacements) {
  if (p.kind === 'extractor') {
    const ext = extById.get(p.refId)
    const rate = ext.baseRate * TIER[p.tier] * PURITY[p.purity] * factors(p)
    produced.set(p.materialId, (produced.get(p.materialId) ?? 0) + rate)
    mwConsumption += (ext.powerUsage?.[p.tier] ?? 0) * powerFactor(p)
    continue
  }
  if (p.kind === 'generator') {
    const g = genById.get(p.refId)
    if (!g) { console.log('DANGLING generator', p.refId); continue }
    const fuel = g.fuels.find((f) => f.refId === p.fuelId)
    const f = factors(p) // generators scale linearly with clock
    if (g.fuels.length === 0) {
      mwProduction += g.powerOutput * PURITY[p.purity] * f
      continue
    }
    if (!fuel) continue // off — no fuel picked
    mwProduction += g.powerOutput * f
    consumed.set(fuel.refId, (consumed.get(fuel.refId) ?? 0) + fuel.rate * f)
    if (g.water)
      consumed.set(g.water.refId, (consumed.get(g.water.refId) ?? 0) + g.water.rate * f)
    if (fuel.byproduct)
      produced.set(
        fuel.byproduct.refId,
        (produced.get(fuel.byproduct.refId) ?? 0) + fuel.byproduct.rate * f,
      )
    continue
  }
  if (p.kind !== 'workbench' || !p.recipeId) continue
  const r = recipeById.get(p.recipeId)
  if (!r) { console.log('DANGLING recipe', p.recipeId); continue }
  const f = factors(p)
  for (const i of r.inputs) consumed.set(i.refId, (consumed.get(i.refId) ?? 0) + i.rate * f)
  for (const o of r.outputs) produced.set(o.refId, (produced.get(o.refId) ?? 0) + o.rate * f)
  const wb = wbById.get(p.refId)
  mwConsumption += (r.power ?? wb?.powerUsage ?? 0) * powerFactor(p)
}

const isProduct = new Set(d.products.items.map((p) => p.id))
const rows = [...new Set([...produced.keys(), ...consumed.keys()])]
const bad = []
for (const id of rows) {
  const pr = produced.get(id) ?? 0
  const net = pr - (consumed.get(id) ?? 0)
  if (net <= 1e-9) bad.push(`${name(id)}: net ${net.toFixed(3)}`)
  else if (isProduct.has(id) && pr < 1 - 1e-9) bad.push(`${name(id)}: produced ${pr.toFixed(3)} < 1`)
}

// ---- structural checks -------------------------------------------------
let structural = 0
const flag = (...m) => { console.log('  !!', ...m); structural++ }
const plById = new Map(allPlacements.map((p) => [p.id, p]))
const nodeById = new Map(d.nodes.items.map((n) => [n.id, n]))
const floorIds = new Set(d.floors.items.map((f) => f.id))

// Legacy power artefacts must be gone from the catalogue.
if (d.products.items.some((p) => p.id === 'prod__power')) flag('prod__power still present')
if (d.recipes.items.some((r) => r.id.startsWith('rec__gen-'))) flag('Burn recipe still present')
if (d.workbenches.items.some((w) => w.id.startsWith('wb__desc-generator'))) flag('generator workbench still present')
if (!d.generators || d.generators.items.length === 0) flag('generators slice missing/empty')

const ids = new Set()
for (const p of allPlacements) {
  if (ids.has(p.id)) flag('dup placement id', p.id)
  ids.add(p.id)
  const ok =
    p.kind === 'extractor'
      ? extById.has(p.refId)
      : p.kind === 'generator'
        ? genById.has(p.refId)
        : wbById.has(p.refId)
  if (!ok) flag('bad refId', p.refId)
  if (!(p.x >= 0) || !(p.quantity >= 1)) flag('bad x/qty', p.id)
  if (p.fuelId !== null && p.kind !== 'generator') flag('fuelId on non-generator', p.id)
  if (p.kind === 'generator' && p.fuelId) {
    const g = genById.get(p.refId)
    if (!g?.fuels.some((f) => f.refId === p.fuelId)) flag('unknown fuel', p.fuelId)
  }
  for (const c of p.configs)
    if (!(c.clock >= 1 && c.clock <= 250) || c.count > p.quantity) flag('bad config', p.id)
}
for (const n of d.nodes.items) {
  if (!floorIds.has(n.floorId)) flag('node on missing floor', n.id)
  if (n.kind !== 'splitter' && n.kind !== 'merger') flag('bad node kind', n.id)
}

// Wiring: endpoints exist, ports in range, ONE line per port, and every input
// line of every placement whose item is produced is fed exactly once.
const usedFrom = new Set()
const usedTo = new Set()
const transportIds = new Set([
  ...d.conveyors.items.map((c) => c.id),
  ...d.pipelines.items.map((p) => p.id),
])
for (const c of d.connections.items) {
  for (const [end, used] of [[c.from, usedFrom], [c.to, usedTo]]) {
    const key = `${end.id}::${end.port}`
    if (used.has(key)) flag('port double-used', key)
    used.add(key)
    if (end.ref === 'placement' && !plById.has(end.id)) flag('missing placement', end.id)
    if (end.ref === 'node' && !nodeById.has(end.id)) flag('missing node', end.id)
  }
  if (!transportIds.has(c.transportId)) flag('bad transport', c.transportId)
  if (c.from.ref === 'node' && (c.from.port < 0 || c.from.port > 2)) flag('splitter out port', c.id)
  if (c.to.ref === 'node' && c.to.port !== 0) flag('splitter in port', c.id)
}

const producedIds = new Set(rows.filter((id) => (produced.get(id) ?? 0) > 0))
let expectedInputs = 0
const expectWired = (pid, port, label) => {
  expectedInputs++
  if (!usedTo.has(`${pid}::${port}`)) flag('unwired input', `${label} -> ${pid}:${port}`)
}
for (const p of allPlacements) {
  if (p.kind === 'generator') {
    const g = genById.get(p.refId)
    const fuel = g?.fuels.find((f) => f.refId === p.fuelId)
    if (!fuel) continue
    if (producedIds.has(fuel.refId)) expectWired(p.id, 0, name(fuel.refId))
    if (g.water && producedIds.has(g.water.refId))
      expectWired(p.id, 1, name(g.water.refId))
    continue
  }
  if (p.kind !== 'workbench' || !p.recipeId) continue
  const r = recipeById.get(p.recipeId)
  r.inputs.forEach((inp, i) => {
    if (!producedIds.has(inp.refId)) return
    expectWired(p.id, i, name(inp.refId))
  })
  const wb = wbById.get(p.refId)
  if (r.inputs.length > wb.inputs) flag('recipe inputs exceed ports', p.id)
}

console.log(`rows: ${rows.length}`)
console.log(`rows failing the goal (net>0, product produced>=1): ${bad.length}`)
for (const b of bad) console.log('  ', b)
const mwOk = mwProduction >= mwConsumption - 1e-6 && mwConsumption > 0
console.log(
  `power: production ${mwProduction.toFixed(0)} MW vs consumption ${mwConsumption.toFixed(0)} MW -> ${mwOk ? 'OK' : 'DEFICIT'}`,
)
console.log(`connections: ${d.connections.items.length}, nodes: ${d.nodes.items.length}, wired inputs: ${expectedInputs}`)
console.log(`structural problems: ${structural}`)
const pass = bad.length === 0 && structural === 0 && mwOk
console.log(pass ? 'PASS' : 'FAIL')
process.exitCode = pass ? 0 : 1
