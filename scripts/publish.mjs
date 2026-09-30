// Downloads the public trust material of VIDI (DID documents of the issuers and signed
// revocation lists) and writes it as static files. Contains only public data.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const SOURCE = process.env.TRUST_URL ?? 'https://mjvtumuahmgbsjuiwklc.supabase.co/functions/v1/credentials/trust'
const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`${SOURCE} -> ${res.status}`)
const body = await res.json()
if (!body.ok || !body.files) throw new Error('unexpected response')

let changed = 0
for (const [path, doc] of Object.entries(body.files)) {
  if (!/^(org\/[0-9a-f-]{36}\/did\.json|status\/[0-9a-f-]{36}\.json|\.well-known\/did\.json)$/.test(path)) {
    throw new Error(`unexpected path: ${path}`)
  }
  const text = JSON.stringify(doc, null, 2) + '\n'
  let old = null
  try {
    old = readFileSync(path, 'utf8')
  } catch {}
  if (old !== text) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
    changed++
  }
}
console.log(`${Object.keys(body.files).length} files, ${changed} changed`)
