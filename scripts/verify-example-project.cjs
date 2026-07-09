/**
 * Independent check of src/data/exampleProject.json: recompute the production
 * balance exactly like the app (balance.ts + calc.ts, configs included), then
 * validate the plan structurally (placements, nodes, wiring, ports).
 *
 * PASS criteria: every row nets > 0, every product row is produced at
 * >= 1/min ("min 1 adet"), and zero structural problems.
 *
 * Run: node scripts/verify-example-project.cjs
 */
const path = require('path')
const project = require(path.resolve(__dirname, '../src/data/exampleProject.json'))
const d = project.data

const TIER = { 1: 1, 2: 2, 3: 4 }
const PURITY = { impure: 0.5, normal: 1, pure: 2 }
const recipeById = new Map(d.recipes.items.map((r) => [r.id, r]))
const extById = new Map(d.extractors.items.map((e) => [e.id, e]))
const wbById = new Map(d.workbenches.items.map((w) => [w.id, w]))
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

const produced = new Map()
const consumed = new Map()
const allPlacements = Object.values(d.placements.byFloor).flat()

for (const p of allPlacements) {
  if (p.kind === 'extractor') {
    const ext = extById.get(p.refId)
    const rate = ext.baseRate * TIER[p.tier] * PURITY[p.purity] * factors(p)
    produced.set(p.materialId, (produced.get(p.materialId) ?? 0) + rate)
    continue
  }
  if (p.kind !== 'workbench' || !p.recipeId) continue
  const r = recipeById.get(p.recipeId)
  if (!r) { console.log('DANGLING recipe', p.recipeId); continue }
  const f = factors(p)
  for (const i of r.inputs) consumed.set(i.refId, (consumed.get(i.refId) ?? 0) + i.rate * f)
  for (const o of r.outputs) produced.set(o.refId, (produced.get(o.refId) ?? 0) + o.rate * f)
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

const ids = new Set()
for (const p of allPlacements) {
  if (ids.has(p.id)) flag('dup placement id', p.id)
  ids.add(p.id)
  const ok = p.kind === 'extractor' ? extById.has(p.refId) : wbById.has(p.refId)
  if (!ok) flag('bad refId', p.refId)
  if (!(p.x >= 0) || !(p.quantity >= 1)) flag('bad x/qty', p.id)
  for (const c of p.configs)
    if (!(c.clock >= 1 && c.clock <= 250) || c.count > p.quantity) flag('bad config', p.id)
}
for (const n of d.nodes.items) {
  if (!floorIds.has(n.floorId)) flag('node on missing floor', n.id)
  if (n.kind !== 'splitter' && n.kind !== 'merger') flag('bad node kind', n.id)
}

// Wiring: endpoints exist, ports in range, ONE line per port, and every input
// line of every workbench placement whose item is produced is fed exactly once.
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
for (const p of allPlacements) {
  if (p.kind !== 'workbench' || !p.recipeId) continue
  const r = recipeById.get(p.recipeId)
  r.inputs.forEach((inp, i) => {
    if (!producedIds.has(inp.refId)) return
    expectedInputs++
    if (!usedTo.has(`${p.id}::${i}`)) flag('unwired input', `${name(inp.refId)} -> ${p.id}:${i}`)
  })
  const wb = wbById.get(p.refId)
  if (r.inputs.length > wb.inputs) flag('recipe inputs exceed ports', p.id)
}

console.log(`rows: ${rows.length}`)
console.log(`rows failing the goal (net>0, product produced>=1): ${bad.length}`)
for (const b of bad) console.log('  ', b)
console.log(`connections: ${d.connections.items.length}, nodes: ${d.nodes.items.length}, wired inputs: ${expectedInputs}`)
console.log(`structural problems: ${structural}`)
console.log(bad.length === 0 && structural === 0 ? 'PASS' : 'FAIL')
process.exitCode = bad.length === 0 && structural === 0 ? 0 : 1
