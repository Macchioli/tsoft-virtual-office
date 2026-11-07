// Comprime los GLB de models-src/ hacia public/models/ (texturas a 512 px en WebP + geometría Meshopt).
// No toca la geometría ni los huesos: los NPC tienen esqueleto y animación, no se simplifica la malla.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'models-src'
const OUT = 'public/models'
mkdirSync(OUT, { recursive: true })

const kb = (f) => (statSync(f).size / 1024).toFixed(0) + ' KB'

for (const f of readdirSync(SRC).filter((n) => n.endsWith('.glb'))) {
  const from = join(SRC, f)
  const to = join(OUT, f)
  console.log(`→ ${f}  (${kb(from)})`)
  execFileSync(
    'npx',
    [
      'gltf-transform', 'optimize', from, to,
      '--compress', 'meshopt',
      '--texture-compress', 'webp',
      '--texture-size', '512',
      '--simplify', 'false',
      '--join', 'false',
      '--flatten', 'false',
      '--palette', 'false',
      '--instance', 'false',
    ],
    { stdio: 'inherit', shell: process.platform === 'win32' }
  )
  console.log(`✓ ${f}  ${kb(from)} → ${kb(to)}`)
}
