import { createRng } from '../lib/rng.js'
import { isoInDays, toISODate, TODAY } from '../lib/date.js'

/**
 * Medicine batch records.
 *
 * Backend contract (per batch):
 *   id, name, genericName, category, manufacturer, batchNumber, barcode,
 *   quantity, minimumStock, purchasePrice, sellingPrice, expiryDate,
 *   supplierId, storageCondition, createdAt, updatedAt
 * Extra UI fields: form (tablet|capsule|syrup|injection|ointment|supply),
 *   strength, unit, location (shelf/bin), quarantined
 *
 * The data set is generated deterministically from a realistic catalog so the
 * dashboard always looks populated and consistent relative to "today":
 *   120 batches · 2,486 units · 48 low stock · 7 out of stock
 *   expired 7 · ≤7 days 5 · 8–30 days 18 · 31–90 days 42
 */

export const FORMS = {
  tablet: { label: 'Tablets', singular: 'Tablet' },
  capsule: { label: 'Capsules', singular: 'Capsule' },
  syrup: { label: 'Syrups', singular: 'Syrup' },
  injection: { label: 'Injections', singular: 'Injection' },
  ointment: { label: 'Ointments', singular: 'Ointment' },
  supply: { label: 'Medical Supplies', singular: 'Supply' },
}

const S = {
  room: 'Store below 25°C in a dry place',
  room30: 'Store below 30°C, protect from light and moisture',
  cold: 'Refrigerate at 2–8°C · Do not freeze',
  coldUnopened: 'Refrigerate at 2–8°C before opening · Below 30°C once in use (28 days)',
  syrup: 'Store below 25°C · Use within 30 days of opening',
  topical: 'Store below 25°C · Do not freeze',
  dry: 'Store in a clean, dry place away from sunlight',
}

// [name, genericName, category, form, manufacturer, purchasePrice, minStock, supplierId, unit, storage]
const CATALOG = [
  ['Paracetamol 500mg', 'Paracetamol', 'Analgesic', 'tablet', 'GSK Pharmaceuticals', 18, 50, 'sup-medsupply', 'Strip of 10', S.room30],
  ['Ibuprofen 400mg', 'Ibuprofen', 'Analgesic', 'tablet', 'Abbott India', 32, 30, 'sup-medsupply', 'Strip of 10', S.room30],
  ['Diclofenac 50mg', 'Diclofenac Sodium', 'NSAID', 'tablet', 'Novartis', 28, 25, 'sup-pharmacare', 'Strip of 10', S.room30],
  ['Aspirin 75mg', 'Acetylsalicylic Acid', 'Antiplatelet', 'tablet', 'Bayer', 22, 30, 'sup-medsupply', 'Strip of 14', S.room],
  ['Metformin 500mg', 'Metformin Hydrochloride', 'Antidiabetic', 'tablet', 'Sun Pharma', 24, 40, 'sup-medisource', 'Strip of 10', S.room30],
  ['Glimepiride 2mg', 'Glimepiride', 'Antidiabetic', 'tablet', 'Sanofi India', 85, 20, 'sup-medisource', 'Strip of 10', S.room30],
  ['Amlodipine 5mg', 'Amlodipine Besylate', 'Antihypertensive', 'tablet', 'Cipla', 36, 30, 'sup-pharmacare', 'Strip of 15', S.room30],
  ['Telmisartan 40mg', 'Telmisartan', 'Antihypertensive', 'tablet', 'Glenmark', 92, 25, 'sup-pharmacare', 'Strip of 15', S.room30],
  ['Losartan 50mg', 'Losartan Potassium', 'Antihypertensive', 'tablet', 'Torrent Pharma', 58, 20, 'sup-novadist', 'Strip of 10', S.room30],
  ['Atorvastatin 10mg', 'Atorvastatin Calcium', 'Statin', 'tablet', 'Pfizer', 74, 30, 'sup-medsupply', 'Strip of 15', S.room30],
  ['Rosuvastatin 10mg', 'Rosuvastatin Calcium', 'Statin', 'tablet', 'Lupin', 128, 20, 'sup-zenith', 'Strip of 15', S.room30],
  ['Levothyroxine 50mcg', 'Levothyroxine Sodium', 'Thyroid', 'tablet', 'Abbott India', 112, 25, 'sup-zenith', 'Bottle of 100', S.room],
  ['Cetirizine 10mg', 'Cetirizine Hydrochloride', 'Antihistamine', 'tablet', "Dr. Reddy's", 18, 30, 'sup-medsupply', 'Strip of 10', S.room30],
  ['Montelukast 10mg', 'Montelukast Sodium', 'Respiratory', 'tablet', 'Cipla', 145, 20, 'sup-carelink', 'Strip of 10', S.room30],
  ['Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 'tablet', 'Alembic Pharma', 96, 25, 'sup-pharmacare', 'Strip of 3', S.room30],
  ['Ciprofloxacin 500mg', 'Ciprofloxacin', 'Antibiotic', 'tablet', 'Cipla', 48, 20, 'sup-novadist', 'Strip of 10', S.room30],
  ['Ondansetron 4mg', 'Ondansetron', 'Antiemetic', 'tablet', 'Sun Pharma', 52, 15, 'sup-carelink', 'Strip of 10', S.room30],
  ['Prednisolone 10mg', 'Prednisolone', 'Corticosteroid', 'tablet', 'Wockhardt', 24, 15, 'sup-medisource', 'Strip of 10', S.room30],
  ['Clopidogrel 75mg', 'Clopidogrel Bisulfate', 'Antiplatelet', 'tablet', 'Sanofi India', 98, 20, 'sup-zenith', 'Strip of 15', S.room30],
  ['Sertraline 50mg', 'Sertraline Hydrochloride', 'Antidepressant', 'tablet', 'Torrent Pharma', 118, 15, 'sup-carelink', 'Strip of 10', S.room30],
  ['Folic Acid 5mg', 'Folic Acid', 'Supplement', 'tablet', 'Mankind Pharma', 12, 25, 'sup-novadist', 'Strip of 10', S.room30],
  ['Metoprolol 50mg', 'Metoprolol Succinate', 'Beta Blocker', 'tablet', 'AstraZeneca', 86, 20, 'sup-medsupply', 'Strip of 10', S.room30],
  ['Pantoprazole 40mg', 'Pantoprazole Sodium', 'Gastrointestinal', 'tablet', 'Alkem Laboratories', 88, 30, 'sup-medsupply', 'Strip of 15', S.room30],
  ['Amoxicillin 500mg', 'Amoxicillin Trihydrate', 'Antibiotic', 'capsule', 'Cipla', 68, 40, 'sup-pharmacare', 'Strip of 10', S.room],
  ['Omeprazole 20mg', 'Omeprazole', 'Gastrointestinal', 'capsule', "Dr. Reddy's", 42, 30, 'sup-medsupply', 'Strip of 15', S.room],
  ['Doxycycline 100mg', 'Doxycycline Hyclate', 'Antibiotic', 'capsule', 'Lupin', 54, 20, 'sup-novadist', 'Strip of 10', S.room],
  ['Fluconazole 150mg', 'Fluconazole', 'Antifungal', 'capsule', 'Pfizer', 34, 15, 'sup-carelink', 'Strip of 1', S.room30],
  ['Vitamin D3 60000 IU', 'Cholecalciferol', 'Supplement', 'capsule', 'Mankind Pharma', 46, 25, 'sup-zenith', 'Strip of 4', S.room],
  ['Pregabalin 75mg', 'Pregabalin', 'Neurology', 'capsule', 'Sun Pharma', 165, 15, 'sup-medisource', 'Strip of 10', S.room30],
  ['Cephalexin 500mg', 'Cephalexin', 'Antibiotic', 'capsule', 'Lupin', 112, 20, 'sup-pharmacare', 'Strip of 10', S.room],
  ['Esomeprazole 40mg', 'Esomeprazole Magnesium', 'Gastrointestinal', 'capsule', 'Torrent Pharma', 96, 20, 'sup-medsupply', 'Strip of 10', S.room],
  ['Itraconazole 100mg', 'Itraconazole', 'Antifungal', 'capsule', 'Glenmark', 198, 10, 'sup-carelink', 'Strip of 4', S.room30],
  ['Omega-3 1000mg', 'Omega-3 Fatty Acids', 'Supplement', 'capsule', 'Abbott India', 210, 15, 'sup-zenith', 'Bottle of 30', S.room],
  ['Paracetamol Suspension 120mg/5ml', 'Paracetamol', 'Analgesic', 'syrup', 'GSK Pharmaceuticals', 38, 20, 'sup-medsupply', 'Bottle 60 ml', S.syrup],
  ['Amoxicillin Suspension 250mg/5ml', 'Amoxicillin Trihydrate', 'Antibiotic', 'syrup', 'Cipla', 72, 15, 'sup-pharmacare', 'Bottle 60 ml', S.syrup],
  ['Dextromethorphan Syrup 10mg/5ml', 'Dextromethorphan HBr', 'Respiratory', 'syrup', 'Alkem Laboratories', 95, 20, 'sup-novadist', 'Bottle 100 ml', S.syrup],
  ['Ambroxol Syrup 30mg/5ml', 'Ambroxol Hydrochloride', 'Respiratory', 'syrup', 'Mankind Pharma', 82, 15, 'sup-novadist', 'Bottle 100 ml', S.syrup],
  ['Lactulose Solution 10g/15ml', 'Lactulose', 'Gastrointestinal', 'syrup', 'Abbott India', 245, 10, 'sup-medisource', 'Bottle 200 ml', S.syrup],
  ['Cetirizine Syrup 5mg/5ml', 'Cetirizine Hydrochloride', 'Antihistamine', 'syrup', "Dr. Reddy's", 48, 15, 'sup-medsupply', 'Bottle 60 ml', S.syrup],
  ['Magaldrate Suspension 400mg/5ml', 'Magaldrate + Simethicone', 'Gastrointestinal', 'syrup', 'Sun Pharma', 115, 12, 'sup-carelink', 'Bottle 170 ml', S.syrup],
  ['Ferrous Ascorbate Syrup', 'Ferrous Ascorbate + Folic Acid', 'Supplement', 'syrup', 'Mankind Pharma', 135, 12, 'sup-zenith', 'Bottle 150 ml', S.syrup],
  ['Insulin Glargine', 'Insulin Glargine 100 IU/ml', 'Insulin', 'injection', 'Sanofi India', 690, 20, 'sup-medisource', 'Prefilled pen 3 ml', S.coldUnopened],
  ['Human Insulin 30/70', 'Biphasic Isophane Insulin 40 IU/ml', 'Insulin', 'injection', 'Novo Nordisk', 165, 15, 'sup-coldchain', 'Vial 10 ml', S.coldUnopened],
  ['Insulin Aspart', 'Insulin Aspart 100 IU/ml', 'Insulin', 'injection', 'Novo Nordisk', 520, 10, 'sup-coldchain', 'Penfill cartridge 3 ml', S.coldUnopened],
  ['Ceftriaxone 1g Injection', 'Ceftriaxone Sodium', 'Antibiotic', 'injection', 'Alkem Laboratories', 58, 25, 'sup-pharmacare', 'Vial + diluent', S.room],
  ['Enoxaparin 40mg Injection', 'Enoxaparin Sodium', 'Anticoagulant', 'injection', 'Sanofi India', 380, 10, 'sup-coldchain', 'Prefilled syringe 0.4 ml', S.room],
  ['Ondansetron Injection 2mg/ml', 'Ondansetron', 'Antiemetic', 'injection', 'Cipla', 22, 20, 'sup-carelink', 'Ampoule 2 ml', S.room30],
  ['Methylcobalamin 1500mcg Injection', 'Methylcobalamin', 'Supplement', 'injection', 'Zydus Lifesciences', 64, 15, 'sup-zenith', 'Ampoule 1 ml', S.room30],
  ['Tetanus Toxoid Vaccine', 'Adsorbed Tetanus Toxoid', 'Vaccine', 'injection', 'Serum Institute of India', 28, 20, 'sup-coldchain', 'Vial 0.5 ml', S.cold],
  ['Dexamethasone 4mg/ml Injection', 'Dexamethasone Sodium Phosphate', 'Corticosteroid', 'injection', 'Zydus Lifesciences', 18, 20, 'sup-novadist', 'Vial 2 ml', S.room30],
  ['Mupirocin 2% Ointment', 'Mupirocin', 'Dermatology', 'ointment', 'GSK Pharmaceuticals', 145, 12, 'sup-carelink', 'Tube 5 g', S.topical],
  ['Clotrimazole 1% Cream', 'Clotrimazole', 'Antifungal', 'ointment', 'Glenmark', 72, 15, 'sup-medsupply', 'Tube 20 g', S.topical],
  ['Betamethasone 0.1% Cream', 'Betamethasone Valerate', 'Dermatology', 'ointment', 'GSK Pharmaceuticals', 58, 12, 'sup-pharmacare', 'Tube 20 g', S.topical],
  ['Diclofenac 1% Gel', 'Diclofenac Diethylamine', 'NSAID', 'ointment', 'Novartis', 110, 15, 'sup-medsupply', 'Tube 30 g', S.topical],
  ['Silver Sulfadiazine 1% Cream', 'Silver Sulfadiazine', 'Dermatology', 'ointment', 'Sun Pharma', 96, 10, 'sup-novadist', 'Tube 50 g', S.topical],
  ['Fusidic Acid 2% Cream', 'Fusidic Acid', 'Dermatology', 'ointment', 'Glenmark', 155, 10, 'sup-carelink', 'Tube 15 g', S.topical],
  ['Insulin Syringes 1ml (Pack of 10)', 'U-100 Insulin Syringe 31G', 'Medical Supplies', 'supply', 'BD India', 95, 20, 'sup-unity', 'Pack of 10', S.dry],
  ['Sterile Gauze Swabs', 'Gauze Swab 10×10 cm', 'Medical Supplies', 'supply', 'Johnson & Johnson', 120, 15, 'sup-unity', 'Pack of 100', S.dry],
  ['Nitrile Examination Gloves (M)', 'Powder-free Nitrile Gloves', 'Medical Supplies', 'supply', 'Romsons', 340, 10, 'sup-unity', 'Box of 100', S.dry],
  ['Glucometer Test Strips', 'Blood Glucose Test Strips', 'Diagnostics', 'supply', 'Roche Diabetes Care', 780, 10, 'sup-zenith', 'Box of 50', S.dry],
  ['Surgical Masks 3-Ply', '3-Ply Surgical Face Mask', 'Medical Supplies', 'supply', '3M India', 160, 10, 'sup-unity', 'Box of 50', S.dry],
  ['IV Cannula 20G', 'Intravenous Cannula 20G', 'Medical Supplies', 'supply', 'BD India', 48, 25, 'sup-unity', 'Single unit', S.dry],
  ['Crepe Bandage 10cm', 'Cotton Crepe Bandage', 'Medical Supplies', 'supply', 'Hindustan Latex', 75, 12, 'sup-unity', 'Roll 4 m', S.dry],
]

// Fixed records requested in the product brief.
const PINNED = {
  'Paracetamol 500mg': { batchNumber: 'BAT-23981', quantity: 142, minimumStock: 50, expiryIn: 125, supplierId: 'sup-medsupply' },
  'Amoxicillin 500mg': { batchNumber: 'BAT-18291', quantity: 18, minimumStock: 40, expiryIn: 85, supplierId: 'sup-pharmacare' },
  'Insulin Glargine': { batchNumber: 'BAT-73182', quantity: 12, minimumStock: 20, expiryIn: 15, supplierId: 'sup-medisource' },
}
// Products stocked as a single batch.
const SINGLE_BATCH = new Set(['Paracetamol 500mg', 'Amoxicillin 500mg', 'Insulin Glargine', 'Itraconazole 100mg', 'Lactulose Solution 10g/15ml', 'Crepe Bandage 10cm'])

const EXPIRY_RANGES = {
  expired: [-45, -2],
  d7: [1, 7],
  d30: [9, 29],
  d90: [32, 89],
  d180: [92, 178],
  later: [185, 690],
}

const TARGET_UNITS = 2486

function bucketForDays(d) {
  if (d < 0) return 'expired'
  if (d <= 7) return 'd7'
  if (d <= 30) return 'd30'
  if (d <= 90) return 'd90'
  if (d <= 180) return 'd180'
  return 'later'
}

function ean13(rng) {
  const digits = [8, 9, 0]
  for (let i = 0; i < 9; i++) digits.push(rng.int(0, 9))
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 ? 3 : 1), 0)
  digits.push((10 - (sum % 10)) % 10)
  return digits.join('')
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function generate() {
  const rng = createRng(20261119)

  // 1. Expand catalog into batch slots.
  const slots = []
  CATALOG.forEach((row) => {
    const n = SINGLE_BATCH.has(row[0]) ? 1 : 2
    for (let b = 0; b < n; b++) slots.push({ row, b })
  })

  // 2. Expiry bucket pool (counts per brief), minus pinned records.
  const pool = { expired: 7, d7: 5, d30: 18, d90: 42, d180: 20, later: 0 }
  pool.later = slots.length - Object.values(pool).reduce((a, b) => a + b, 0)
  // 3. Stock-class pool.
  const stock = { out: 7, low: 48 }
  stock.healthy = slots.length - stock.out - stock.low

  Object.values(PINNED).forEach((p) => {
    pool[bucketForDays(p.expiryIn)]--
    const cls = p.quantity === 0 ? 'out' : p.quantity < p.minimumStock ? 'low' : 'healthy'
    stock[cls]--
  })

  const free = rng.shuffle(slots.filter((s) => !(PINNED[s.row[0]] && s.b === 0)))

  // Out-of-stock batches get long expiries (they were sold through, not expired).
  const assignments = new Map()
  const take = (bucket) => {
    pool[bucket]--
    return bucket
  }
  free.forEach((slot, i) => {
    if (i < stock.out) assignments.set(slot, { cls: 'out', bucket: take(pool.later > 0 ? 'later' : 'd180') })
  })
  const bucketBag = rng.shuffle(Object.entries(pool).flatMap(([k, n]) => Array(Math.max(0, n)).fill(k)))
  const clsBag = rng.shuffle([...Array(stock.low).fill('low'), ...Array(stock.healthy).fill('healthy')])
  free.slice(stock.out).forEach((slot, i) => assignments.set(slot, { cls: clsBag[i], bucket: bucketBag[i] }))

  // 4. Build records.
  const usedBatches = new Set(Object.values(PINNED).map((p) => p.batchNumber))
  const records = slots.map((slot) => {
    const [name, genericName, category, form, manufacturer, purchasePrice, minStock, supplierId, unit, storageCondition] = slot.row
    const pinned = slot.b === 0 ? PINNED[name] : null
    let batchNumber = pinned?.batchNumber
    while (!batchNumber || (!pinned && usedBatches.has(batchNumber))) batchNumber = `BAT-${rng.int(10000, 99999)}`
    usedBatches.add(batchNumber)

    let quantity, minimumStock, expiryIn
    if (pinned) {
      ;({ quantity, minimumStock, expiryIn } = pinned)
    } else {
      const a = assignments.get(slot)
      minimumStock = Math.max(5, Math.round(minStock * rng.float(0.45, 0.7)))
      if (a.cls === 'out') quantity = 0
      else if (a.cls === 'low') quantity = rng.int(Math.max(1, Math.round(minimumStock * 0.2)), minimumStock - 1)
      else quantity = rng.int(minimumStock, Math.round(minimumStock * 1.6))
      const [lo, hi] = EXPIRY_RANGES[a.bucket]
      expiryIn = rng.int(lo, hi)
    }

    const price = Math.round(purchasePrice * rng.float(0.94, 1.06) * 100) / 100
    const createdDaysAgo = rng.int(40, 300)
    return {
      id: `med-${slug(name)}-${slot.b + 1}`,
      name,
      genericName,
      category,
      form,
      manufacturer,
      batchNumber,
      barcode: ean13(rng),
      quantity,
      minimumStock,
      purchasePrice: price,
      sellingPrice: Math.round(price * rng.float(1.18, 1.34) * 100) / 100,
      expiryDate: isoInDays(expiryIn),
      supplierId: pinned?.supplierId ?? supplierId,
      storageCondition,
      unit,
      location: `${'ABCDEF'[Object.keys(FORMS).indexOf(form)]}${rng.int(1, 6)}-${String(rng.int(1, 24)).padStart(2, '0')}`,
      quarantined: false,
      createdAt: new Date(TODAY.getTime() - createdDaysAgo * 86_400_000).toISOString(),
      updatedAt: new Date(TODAY.getTime() - rng.int(0, 20) * 86_400_000 + rng.int(8, 20) * 3_600_000).toISOString(),
    }
  })

  // 5. Nudge healthy quantities so total units match the brief exactly.
  let delta = TARGET_UNITS - records.reduce((s, r) => s + r.quantity, 0)
  const adjustable = records.filter((r) => !PINNED[r.name] && r.quantity >= r.minimumStock)
  let guard = 0
  while (delta !== 0 && guard++ < 20000) {
    const r = adjustable[guard % adjustable.length]
    if (delta > 0) {
      r.quantity++
      delta--
    } else if (r.quantity > r.minimumStock) {
      r.quantity--
      delta++
    }
  }

  return records
}

export const medicines = generate()

export const CATEGORIES = [...new Set(CATALOG.map((r) => r[2]))].sort()
export const MANUFACTURERS = [...new Set(CATALOG.map((r) => r[4]))].sort()

/** Sample record shape used by the "Add medicine" form. */
export const EMPTY_MEDICINE = {
  name: '',
  genericName: '',
  category: 'Analgesic',
  form: 'tablet',
  manufacturer: '',
  batchNumber: '',
  barcode: '',
  quantity: 0,
  minimumStock: 20,
  purchasePrice: 0,
  sellingPrice: 0,
  expiryDate: toISODate(new Date(TODAY.getTime() + 365 * 86_400_000)),
  supplierId: 'sup-medsupply',
  storageCondition: S.room30,
  unit: 'Strip of 10',
}
