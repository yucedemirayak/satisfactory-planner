/**
 * Generate src/data/exampleProject.json — the "produce everything" example
 * mega-factory — from the untouched default catalogue in defaultProject.json.
 *
 * Goals (user spec):
 *   - Every automatable product is PRODUCED at >= 1/min ("min 1 adet"), with
 *     only a symbolic +0.01 surplus — intermediates cover their consumers, no
 *     stacked over-production. Terminal products naturally net ~+1.
 *   - NO deficit rows: chains that need hand-collected pickups (leaves, alien
 *     remains, power slugs…) are treated as non-producible and left out.
 *   - "Best alternate" recipes: per product, the cheapest chain by weighted
 *     raw-resource cost (weights ~ inverse world availability on the 1.0 map).
 *   - Every machine runs at exactly 100% clock (user rule: "çalışma oranları
 *     hep 100% olsun") — counts are rounded UP to whole machines and the
 *     small overproduction that compounds upstream is accepted.
 *   - Fully wired: producer output -> splitter chain -> consumers, one line
 *     per port; solids on Conveyor Mk.6, fluids on Pipeline Mk.2.
 *   - POWERED: real generator placements (Nuclear Power Plants from the
 *     catalogue's generators slice) produce more MW than every machine draws.
 *     Power is NOT an item — the plants burn Uranium/Plutonium Fuel Rods
 *     (produced by the plan) and emit the waste the plutonium chain consumes.
 *     Plant counts and fuel demand are solved together (outer fixpoint).
 *
 * Run: node scripts/generate-example-project.cjs
 */
const fs = require('fs')
const path = require('path')

const FILE = path.resolve(__dirname, '../src/data/defaultProject.json')
const OUT = path.resolve(__dirname, '../src/data/exampleProject.json')
const project = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const data = project.data

const P = (slug) => `prod__${slug}`
const M = (slug) => `mat__${slug}`

// ------------------------------------------------------------------- lookups
const recipes = data.recipes.items
const products = data.products.items
const materials = data.materials.items
const wbById = new Map(data.workbenches.items.map((w) => [w.id, w]))
const prodById = new Map(products.map((p) => [p.id, p]))
const matById = new Map(materials.map((m) => [m.id, m]))
const nameOf = (id) => prodById.get(id)?.name ?? matById.get(id)?.name ?? id

// Raw-material weights ~ iron / world availability (1.0 map node totals).
const MAT_WEIGHT = {
  'mat__desc-oreiron-c': 1, 'mat__desc-stone-c': 1.3, 'mat__desc-orecopper-c': 2.5,
  'mat__desc-coal-c': 2.2, 'mat__desc-oregold-c': 6.2, 'mat__desc-rawquartz-c': 6.6,
  'mat__desc-sulfur-c': 8.5, 'mat__desc-orebauxite-c': 7.5, 'mat__desc-liquidoil-c': 7.3,
  'mat__desc-nitrogengas-c': 7.7, 'mat__desc-sam-c': 9, 'mat__desc-oreuranium-c': 44,
  'mat__desc-water-c': 0.001,
}

// ------------------------------------------------------------ power section
// The example is powered by Nuclear Power Plants (real generator placements).
// Two banks: one burning Uranium Fuel Rods (emits the Uranium Waste the
// plutonium chain eats), one burning Plutonium Fuel Rods (emits Plutonium
// Waste for Ficsonium). Both rods and all the water come from the plan.
const NPP = data.generators.items.find((g) => g.id === 'gen__nuclear-plant')
if (!NPP) throw new Error('gen__nuclear-plant missing from defaultProject')
const UFR = P('desc-nuclearfuelrod-c')
const PFR = P('desc-plutoniumfuelrod-c')
const UWASTE = P('desc-nuclearwaste-c')
const PWASTE = P('desc-plutoniumwaste-c')
const WATER = M('desc-water-c')
const fuelOf = (refId) => NPP.fuels.find((f) => f.refId === refId)

// NPP counts per fuel — refined by the outer power fixpoint below.
const genCount = { u: 1, p: 1 }
const genConsumption = () =>
  new Map([
    [UFR, fuelOf(UFR).rate * genCount.u],
    [PFR, fuelOf(PFR).rate * genCount.p],
    [WATER, NPP.water.rate * (genCount.u + genCount.p)],
  ])
const genProduction = () =>
  new Map([
    [UWASTE, fuelOf(UFR).byproduct.rate * genCount.u],
    [PWASTE, fuelOf(PFR).byproduct.rate * genCount.p],
  ])

// -------------------------------------------------------- candidate recipes
// Unpackage recipes would form free package<->unpackage loops; never pick them
// as producers.
const isCandidate = (r) => !r.name.startsWith('Unpackage')
const producersOf = new Map() // productId -> recipes
for (const r of recipes) {
  if (!isCandidate(r)) continue
  for (const o of r.outputs) {
    if (!producersOf.has(o.refId)) producersOf.set(o.refId, [])
    producersOf.get(o.refId).push(r)
  }
}

const producible = products.filter((p) => producersOf.has(p.id)).map((p) => p.id)

// ------------------------------------------------- cost fixpoint (best alts)
// Hand-collected world pickups (leaves, alien remains, power slugs…) have NO
// producer. Chains that depend on them cost Infinity → never chosen, so the
// plan shows zero deficit rows. The nuclear wastes DO have a producer now:
// the power plants — cost them like a cheap raw so waste-consuming chains
// (plutonium, Ficsonium) stay producible.
const cost = new Map() // refId -> cost per unit
for (const m of materials) cost.set(m.id, MAT_WEIGHT[m.id] ?? 5)
cost.set(UWASTE, 1)
cost.set(PWASTE, 1)

const inputCost = (refId) => {
  if (cost.has(refId)) return cost.get(refId)
  if (matById.has(refId)) return MAT_WEIGHT[refId] ?? 5
  return Infinity // pickups and not-yet-costed products
}

const outRate = (r, refId) => r.outputs.find((o) => o.refId === refId)?.rate ?? 0

for (let iter = 0; iter < 400; iter++) {
  let changed = false
  for (const pid of producible) {
    if (pid === UWASTE || pid === PWASTE) continue // generator-made
    let best = Infinity
    for (const r of producersOf.get(pid)) {
      const inSum = r.inputs.reduce((s, i) => s + i.rate * inputCost(i.refId), 0)
      const c = inSum / outRate(r, pid) + 0.01 // epsilon: prefer shorter chains
      if (c < best) best = c
    }
    if (best < (cost.get(pid) ?? Infinity) - 1e-9) {
      cost.set(pid, best)
      changed = true
    }
  }
  if (!changed) break
}

// Pick the argmin recipe per product. Wastes are generator byproducts, never
// recipe-made. A product whose every chain needs a pickup stays unchosen
// (cost Infinity).
const chosen = new Map() // productId -> recipe
for (const pid of producible) {
  if (pid === UWASTE || pid === PWASTE) continue
  let best = null
  let bestC = Infinity
  for (const r of producersOf.get(pid)) {
    const inSum = r.inputs.reduce((s, i) => s + i.rate * inputCost(i.refId), 0)
    const c = inSum / outRate(r, pid) + 0.01
    if (c < bestC - 1e-12) { bestC = c; best = r }
  }
  if (best) chosen.set(pid, best)
}
// Slug-based shard recipes need hand-collected slugs; the synthetic recipe is
// fully automatable and its inputs are produced anyway.
const synthShard = recipes.find((r) => r.name === 'Synthetic Power Shard')
if (synthShard) chosen.set(P('desc-crystalshard-c'), synthShard)

// roles: recipe -> products it must supply
const byId = new Map(recipes.map((r) => [r.id, r]))
const roles = new Map()
for (const [pid, r] of chosen) {
  if (!roles.has(r.id)) roles.set(r.id, new Set())
  roles.get(r.id).add(pid)
}
const chosenRecipes = [...roles.keys()].map((id) => byId.get(id))

// ------------------------------------------------------ demand fixpoint
// Required production per product: cover downstream consumption — including
// the power plants' fuel/water intake — plus a symbolic surplus, and never
// below 1/min.
const MIN_RATE = 1 // every product visible at >= 1/min
const SURPLUS = 0.01 // symbolic headroom over consumption
const requiredOf = (consValue) => Math.max(MIN_RATE, consValue + SURPLUS)

const qty = new Map() // recipeId -> machine count

const solveMachines = () => {
  let machines = new Map(chosenRecipes.map((r) => [r.id, 0]))
  for (let iter = 0; iter < 600; iter++) {
    const cons = new Map(genConsumption())
    for (const r of chosenRecipes) {
      const m = machines.get(r.id)
      if (!m) continue
      for (const i of r.inputs) cons.set(i.refId, (cons.get(i.refId) ?? 0) + i.rate * m)
    }
    let maxDelta = 0
    const next = new Map()
    for (const r of chosenRecipes) {
      let need = 0
      for (const pid of roles.get(r.id)) {
        const want = requiredOf(cons.get(pid) ?? 0) / outRate(r, pid)
        if (want > need) need = want
      }
      next.set(r.id, need)
      maxDelta = Math.max(maxDelta, Math.abs(need - machines.get(r.id)))
    }
    machines = next
    if (maxDelta < 1e-7) break
  }

  // ------------------ integerize at 100% clock (no configs at all)
  // User rule: every machine runs at exactly 100% — no under/overclocking.
  // quantity = ceil(m); each placement then produces a bit more than needed
  // and that overshoot compounds upstream — accepted.
  qty.clear()
  for (const r of chosenRecipes)
    qty.set(r.id, Math.max(1, Math.ceil(machines.get(r.id) - 1e-9)))

  // Whole machines consume at full rate; bump producers until stable.
  for (let iter = 0; iter < 300; iter++) {
    const { produced, consumed } = balanceOf()
    let fixed = false
    for (const [pid, r] of chosen) {
      const deficit = requiredOf(consumed.get(pid) ?? 0) - (produced.get(pid) ?? 0)
      if (deficit > 1e-9) {
        qty.set(r.id, qty.get(r.id) + Math.ceil(deficit / outRate(r, pid) - 1e-9))
        fixed = true
      }
    }
    if (!fixed) break
  }
}

// Item balance of the recipe machines + power plants (extractors excluded).
const balanceOf = () => {
  const produced = new Map(genProduction())
  const consumed = new Map(genConsumption())
  for (const r of chosenRecipes) {
    const q = qty.get(r.id)
    for (const i of r.inputs) consumed.set(i.refId, (consumed.get(i.refId) ?? 0) + i.rate * q)
    for (const o of r.outputs) produced.set(o.refId, (produced.get(o.refId) ?? 0) + o.rate * q)
  }
  return { produced, consumed }
}

// ------------------------------------------------------------ extractors
const EXTRACTOR_SETUP = {
  // materialId -> { purity, tier } ; per-unit rate = base * tierMult * purityMult
  default: { purity: 'pure', tier: 3 }, // Miner Mk.3 on a pure node
  'mat__desc-water-c': { purity: 'normal', tier: 1 },
  'mat__desc-liquidoil-c': { purity: 'pure', tier: 1 },
  'mat__desc-nitrogengas-c': { purity: 'normal', tier: 1 },
}
const TIER_MULT = { 1: 1, 2: 2, 3: 4 }
const PURITY_MULT = { impure: 0.5, normal: 1, pure: 2 }

let extractorPlacements = []
const solveExtractors = () => {
  const { consumed } = balanceOf()
  extractorPlacements = []
  for (const m of materials) {
    const ext = data.extractors.items.find((e) => e.id === m.extractorId)
    if (!ext) continue
    const setup = EXTRACTOR_SETUP[m.id] ?? EXTRACTOR_SETUP.default
    const perUnit = ext.baseRate * TIER_MULT[setup.tier] * PURITY_MULT[setup.purity]
    const need = (consumed.get(m.id) ?? 0) + SURPLUS
    const count = Math.max(1, Math.ceil(need / perUnit))
    extractorPlacements.push({
      id: `pl-ext__${m.id.replace('mat__', '')}`,
      kind: 'extractor',
      refId: ext.id,
      x: 0,
      quantity: count,
      recipeId: null,
      configs: [],
      materialId: m.id,
      purity: setup.purity,
      tier: setup.tier,
      fuelId: null,
    })
  }
}

// --------------------------------------------------------- power fixpoint
// MW drawn by every machine at 100% clock (recipe override beats the
// workbench draw; extractor draw depends on the Mk tier).
const powerConsumption = () => {
  let mw = 0
  for (const r of chosenRecipes) {
    const wb = wbById.get(r.workbenchId)
    mw += qty.get(r.id) * (r.power ?? wb?.powerUsage ?? 0)
  }
  for (const pl of extractorPlacements) {
    const ext = data.extractors.items.find((e) => e.id === pl.refId)
    mw += pl.quantity * (ext.powerUsage?.[pl.tier] ?? 0)
  }
  return mw
}

// Outer loop: plant counts drive fuel/water demand, which grows the factory,
// which raises the MW bill, which may need more plants. Converges fast.
for (let round = 0; round < 20; round++) {
  solveMachines()
  solveExtractors()

  const { consumed } = balanceOf()
  const needMw = powerConsumption()
  // Plutonium bank: enough waste for its consumers (also >= 1/min visible).
  const p = Math.max(
    1,
    Math.ceil(((consumed.get(PWASTE) ?? 0) + SURPLUS) / fuelOf(PFR).byproduct.rate),
  )
  // Uranium bank: cover the waste eaters AND the rest of the MW bill.
  const u = Math.max(
    1,
    Math.ceil(((consumed.get(UWASTE) ?? 0) + SURPLUS) / fuelOf(UFR).byproduct.rate),
    Math.ceil(needMw / NPP.powerOutput) - p,
  )
  if (u === genCount.u && p === genCount.p) break
  genCount.u = u
  genCount.p = p
}

// ------------------------------------------------------------- floor layout
// Stage = topological depth of the chosen-recipe graph (extractors = stage 0).
const depthMemo = new Map()
const depthOf = (pid, stack = new Set()) => {
  if (matById.has(pid)) return 0
  if (!chosen.has(pid)) return 0 // pickups & generator wastes
  if (depthMemo.has(pid)) return depthMemo.get(pid)
  if (stack.has(pid)) return 0 // cycle guard (recycled loops)
  stack.add(pid)
  const r = chosen.get(pid)
  let d = 0
  for (const i of r.inputs) d = Math.max(d, depthOf(i.refId, stack))
  stack.delete(pid)
  depthMemo.set(pid, d + 1)
  return d + 1
}
const recipeDepth = new Map()
for (const r of chosenRecipes) {
  let d = 1
  for (const pid of roles.get(r.id)) d = Math.max(d, depthOf(pid))
  recipeDepth.set(r.id, d)
}

const byDepth = new Map()
for (const r of chosenRecipes) {
  const d = recipeDepth.get(r.id)
  if (!byDepth.has(d)) byDepth.set(d, [])
  byDepth.get(d).push(r)
}

const GAP = 2
const MAX_FLOOR_WIDTH = 340
const floors = []
const byFloor = {}
let floorSeq = 0

const defOf = (pl) =>
  pl.kind === 'workbench'
    ? wbById.get(pl.refId)
    : pl.kind === 'generator'
      ? data.generators.items.find((g) => g.id === pl.refId)
      : data.extractors.items.find((e) => e.id === pl.refId)

const addFloor = (name, placements) => {
  const id = `floor__${String(floorSeq++).padStart(2, '0')}`
  let maxH = 0
  let x = GAP
  for (const pl of placements) {
    const def = defOf(pl)
    pl.x = x
    x += (def?.width ?? 10) + GAP
    maxH = Math.max(maxH, def?.height ?? 8)
  }
  floors.push({ id, name, height: Math.max(8, Math.ceil(maxH + 3)) })
  byFloor[id] = placements
}

// Ground floor: all extractors.
addFloor('Resource Extraction', extractorPlacements)

const dominantName = (placements) => {
  const counts = new Map()
  for (const pl of placements) {
    const n = wbById.get(pl.refId)?.name ?? 'Machines'
    counts.set(n, (counts.get(n) ?? 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
  return top.endsWith('y') ? `${top.slice(0, -1)}ies` : `${top}s`
}

const workbenchPlacement = (r) => ({
  id: `pl__${r.id.replace('rec__', '')}`,
  kind: 'workbench',
  refId: r.workbenchId,
  x: 0,
  quantity: qty.get(r.id),
  recipeId: r.id,
  configs: [],
  materialId: null,
  purity: 'normal',
  tier: 1,
  fuelId: null,
})

const depths = [...byDepth.keys()].sort((a, b) => a - b)
for (const d of depths) {
  const rs = byDepth.get(d).sort((a, b) => a.name.localeCompare(b.name))
  const placements = rs.map(workbenchPlacement)
  // Split over multiple floors when a stage gets too wide.
  let chunk = []
  let width = GAP
  let part = 0
  const flush = () => {
    if (!chunk.length) return
    part++
    const base = `Stage ${d} — ${dominantName(chunk)}`
    addFloor(part > 1 ? `${base} (${part})` : base, chunk)
    chunk = []
    width = GAP
  }
  for (const pl of placements) {
    const w = (wbById.get(pl.refId)?.width ?? 10) + GAP
    if (width + w > MAX_FLOOR_WIDTH && chunk.length) flush()
    chunk.push(pl)
    width += w
  }
  flush()
}

// Topmost floor: the power plant — real generator placements, one bank per
// fuel. Power is not an item; the MW balance lives on the Energy page.
const generatorPlacement = (bank, fuelId, count) => ({
  id: `pl-gen__${bank}`,
  kind: 'generator',
  refId: NPP.id,
  x: 0,
  quantity: count,
  recipeId: null,
  configs: [],
  materialId: null,
  purity: 'normal',
  tier: 1,
  fuelId,
})
const nppU = generatorPlacement('uranium', UFR, genCount.u)
const nppP = generatorPlacement('plutonium', PFR, genCount.p)
addFloor('Power Plant', [nppU, nppP])

// ---------------------------------------------------------------- wiring
// Every recipe input line gets a belt/pipe from its item's producer: direct
// when it's the only consumer, else via a splitter chain placed next to the
// source (each splitter feeds 2 consumers and chains on; the last feeds 3).
// One line per port (the app's rule); solids ride Mk.6, fluids Pipeline Mk.2.
// Power plants join in: fuel -> port 0, water -> port 1, waste out of port 0.
const plFloor = new Map()
for (const fid of Object.keys(byFloor))
  for (const pl of byFloor[fid]) plFloor.set(pl.id, fid)
const allPlacements = Object.values(byFloor).flat()
const plById = new Map(allPlacements.map((p) => [p.id, p]))
const plByRecipe = new Map(
  allPlacements.filter((p) => p.kind === 'workbench').map((p) => [p.recipeId, p]),
)

const isFluid = (refId) =>
  (prodById.get(refId)?.phase ?? matById.get(refId)?.phase ?? 'solid') === 'fluid'
const BELT = 'conv__mk6'
const PIPE = 'pipe__mk2'

const srcOf = new Map() // refId -> { id, port }
for (const [pid, r] of chosen) {
  const pl = plByRecipe.get(r.id)
  if (pl) srcOf.set(pid, { id: pl.id, port: r.outputs.findIndex((o) => o.refId === pid) })
}
for (const pl of extractorPlacements) srcOf.set(pl.materialId, { id: pl.id, port: 0 })
// Wastes leave the plants' single output port.
srcOf.set(UWASTE, { id: nppU.id, port: 0 })
srcOf.set(PWASTE, { id: nppP.id, port: 0 })

const consumersByItem = new Map() // refId -> [{id, port}]
const addConsumer = (refId, id, port) => {
  if (!srcOf.has(refId)) return
  if (!consumersByItem.has(refId)) consumersByItem.set(refId, [])
  consumersByItem.get(refId).push({ id, port })
}
for (const pl of allPlacements) {
  if (pl.kind !== 'workbench') continue
  const r = byId.get(pl.recipeId)
  r.inputs.forEach((inp, i) => addConsumer(inp.refId, pl.id, i))
}
// Plant intake: port 0 = fuel rods, port 1 = water.
addConsumer(UFR, nppU.id, 0)
addConsumer(WATER, nppU.id, 1)
addConsumer(PFR, nppP.id, 0)
addConsumer(WATER, nppP.id, 1)

const routeNodes = []
const connections = []
let connSeq = 0
let nodeSeq = 0
const link = (from, to, fluid) =>
  connections.push({
    id: `conn__${String(connSeq++).padStart(3, '0')}`,
    from: { ref: from.node ? 'node' : 'placement', id: from.id, port: from.port },
    to: { ref: to.node ? 'node' : 'placement', id: to.id, port: to.port },
    transportId: fluid ? PIPE : BELT,
  })

// Deterministic order: bottom floor first, then left to right.
const floorIndex = new Map(floors.map((f, i) => [f.id, i]))
const plOrder = (a) => floorIndex.get(plFloor.get(a.id)) * 10000 + (plById.get(a.id)?.x ?? 0)

for (const [refId, users] of consumersByItem) {
  users.sort((a, b) => plOrder(a) - plOrder(b))
  const src = srcOf.get(refId)
  const fluid = isFluid(refId)
  if (users.length === 1) {
    link(src, users[0], fluid)
    continue
  }
  const srcPl = plById.get(src.id)
  const fid = plFloor.get(src.id)
  const nSplit = Math.ceil((users.length - 1) / 2)
  const chain = []
  for (let k = 0; k < nSplit; k++) {
    const node = {
      id: `node__${String(nodeSeq++).padStart(3, '0')}`,
      kind: 'splitter',
      floorId: fid,
      x: Math.round(srcPl.x + 2 + k * 3),
      y: 2 + (k % 4) * 3,
    }
    routeNodes.push(node)
    chain.push(node)
  }
  link(src, { node: true, id: chain[0].id, port: 0 }, fluid)
  let u = 0
  for (let k = 0; k < nSplit; k++) {
    const isLast = k === nSplit - 1
    const outs = isLast ? 3 : 2
    for (let o = 0; o < outs && u < users.length; o++)
      link({ node: true, id: chain[k].id, port: o }, users[u++], fluid)
    if (!isLast)
      link({ node: true, id: chain[k].id, port: 2 }, { node: true, id: chain[k + 1].id, port: 0 }, fluid)
  }
}

// ------------------------------------------------------------ write project
data.floors = { items: floors, pxPerMeter: data.floors.pxPerMeter ?? 11 }
data.placements = { byFloor }
data.nodes = { items: routeNodes }
data.connections = { items: connections, pendingFrom: null }

// Production page order: raw materials first, then products by stage.
const order = []
for (const m of [...materials].sort((a, b) => a.name.localeCompare(b.name))) order.push(m.id)
const prodsByDepth = [...chosen.keys()]
  .sort((a, b) => depthOf(a) - depthOf(b) || nameOf(a).localeCompare(nameOf(b)))
order.push(...prodsByDepth)
order.push(UWASTE, PWASTE)
data.production = { order }

project.exportedAt = '2026-07-09T00:00:00.000Z'
project.version = 2
fs.writeFileSync(OUT, JSON.stringify(project, null, 2) + '\n')

// ---------------------------------------------------------------- report
const { produced, consumed } = balanceOf()
for (const pl of extractorPlacements) {
  const ext = data.extractors.items.find((e) => e.id === pl.refId)
  const rate = ext.baseRate * TIER_MULT[pl.tier] * PURITY_MULT[pl.purity] * pl.quantity
  produced.set(pl.materialId, (produced.get(pl.materialId) ?? 0) + rate)
}
const rows = new Set([...produced.keys(), ...consumed.keys()])
let ok = 0
const negatives = []
const missing = []
for (const id of rows) {
  const pr = produced.get(id) ?? 0
  const net = pr - (consumed.get(id) ?? 0)
  const enough = net > 1e-9 && (!prodById.has(id) || pr >= MIN_RATE - 1e-9)
  if (enough) ok++
  else negatives.push(`${nameOf(id)}: produced ${pr.toFixed(2)}, net ${net.toFixed(3)}`)
}
for (const p of products) if (!rows.has(p.id)) missing.push(p.name)

const totalMachines = [...qty.values()].reduce((a, b) => a + b, 0)
const totalExtractors = extractorPlacements.reduce((a, p) => a + p.quantity, 0)
const mwProduction = NPP.powerOutput * (genCount.u + genCount.p)
const mwConsumption = powerConsumption()
console.log(`floors: ${floors.length}`)
console.log(`workbench placements: ${chosenRecipes.length} (machines: ${totalMachines})`)
console.log(`extractor placements: ${extractorPlacements.length} (machines: ${totalExtractors})`)
console.log(`power plants: ${genCount.u} uranium + ${genCount.p} plutonium NPPs`)
console.log(`POWER: production ${mwProduction} MW vs consumption ${mwConsumption.toFixed(0)} MW (net ${(mwProduction - mwConsumption).toFixed(0)})`)
console.log(`connections: ${connections.length}, splitter nodes: ${routeNodes.length}`)
console.log(`rows on production page: ${rows.size}, produced>=1 & net>0: ${ok}`)
console.log(`top gross production:`)
for (const [id, v] of [...produced.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8))
  console.log(`   ${nameOf(id)}: ${v.toFixed(0)}/min`)
console.log(`rows failing the goal (expected NONE): ${negatives.length}`)
for (const n of negatives) console.log('  ', n)
console.log(`absent products (no automatable chain): ${missing.length}`)
for (const m of missing) console.log('  -', m)
console.log(`chosen alternates: ${chosenRecipes.filter((r) => r.name.startsWith('Alternate:')).length}`)
console.log(`floors:`)
for (const f of floors) {
  const pls = byFloor[f.id]
  const machineCount = pls.reduce((a, p) => a + p.quantity, 0)
  console.log(`  ${f.id} "${f.name}" h=${f.height}m, ${pls.length} placements (${machineCount} machines)`)
}
