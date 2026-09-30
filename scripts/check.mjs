// Consistency check: the identity documents and revocation lists served on the public site
// must be exactly those derived from the VIDI database. Any difference (tampering with the
// repository or the site, failed deploy, file the database does not know) fails the workflow,
// and GitHub notifies the owner by email.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE = process.env.TRUST_URL ?? 'https://mjvtumuahmgbsjuiwklc.supabase.co/functions/v1/credentials/trust'
const SITE = process.env.SITE_URL ?? 'https://vidi.formazionesicurezza.org'
const ATTEMPTS = Number(process.env.CHECK_ATTEMPTS ?? 12) // Pages needs a minute or two after a push
const WAIT_MS = 20_000

// key order does not matter: compare a canonical form
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]))
  }
  return value
}
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))

function localFiles(dir) {
  try {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name)
      return statSync(path).isDirectory() ? localFiles(path) : [path.replace(/\\/g, '/')]
    })
  } catch {
    return []
  }
}

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`${SOURCE} -> ${res.status}`)
const expected = (await res.json()).files
const problems = []

// files in the repository that the database does not know
for (const path of [...localFiles('org'), ...localFiles('status')]) {
  if (!(path in expected)) problems.push(`file non previsto dal database: ${path}`)
}

for (const [path, doc] of Object.entries(expected)) {
  let ok = false
  let last = ''
  for (let i = 0; i < ATTEMPTS && !ok; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, WAIT_MS))
    const live = await fetch(`${SITE}/${path}?check=${Date.now()}`, { cache: 'no-store' })
    if (!live.ok) {
      last = `HTTP ${live.status}`
      continue
    }
    const cors = live.headers.get('access-control-allow-origin')
    const body = await live.json().catch(() => null)
    if (!same(body, doc)) last = 'contenuto diverso dal database'
    else if (cors !== '*') last = `intestazione CORS mancante (${cors})`
    else ok = true
  }
  if (!ok) problems.push(`${path}: ${last}`)
}

if (problems.length) {
  console.error(`INCOERENZE (${problems.length}):\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(`${Object.keys(expected).length} file online coerenti con il database`)
