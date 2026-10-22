import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useKeyboard } from './useKeyboard'

const SPEED = 4.5
const EYE_HEIGHT = 1.7
const MARGIN = 0.8 // distancia mínima a las paredes (para que las manos no las atraviesen)
const RADIUS = 0.3 // "grosor" del jugador

// ¿Esta posición (x, z) choca con algún obstáculo?
function blocked(colliders, x, z) {
  return colliders.some(
    (d) => Math.abs(x - d.x) < d.w / 2 + RADIUS && Math.abs(z - d.z) < d.d / 2 + RADIUS
  )
}

// colliders y room vienen de la oficina elegida (ver OFFICES en data.js)
export default function Player({ enabled, colliders, room }) {
  const keys = useKeyboard()
  const forward = useRef(new Vector3())
  const right = useRef(new Vector3())
  const move = useRef(new Vector3())

  useFrame((state, delta) => {
    const { camera } = state
    const dt = Math.min(delta, 0.1)

    if (enabled) {
      const k = keys.current
      const f = forward.current
      const r = right.current
      const m = move.current

      camera.getWorldDirection(f)
      f.y = 0
      f.normalize()
      r.crossVectors(f, camera.up).normalize()

      m.set(0, 0, 0)
      if (k.forward) m.add(f)
      if (k.backward) m.sub(f)
      if (k.right) m.add(r)
      if (k.left) m.sub(r)

      if (m.lengthSq() > 0) {
        m.normalize().multiplyScalar(SPEED * dt)

        // Cada eje por separado: así "resbalás" contra los muebles en vez de frenar en seco
        const nx = camera.position.x + m.x
        if (!blocked(colliders, nx, camera.position.z)) camera.position.x = nx

        const nz = camera.position.z + m.z
        if (!blocked(colliders, camera.position.x, nz)) camera.position.z = nz
      }
    }

    const limX = room.w / 2 - MARGIN
    const limZ = room.d / 2 - MARGIN
    camera.position.x = Math.max(-limX, Math.min(limX, camera.position.x))
    camera.position.z = Math.max(-limZ, Math.min(limZ, camera.position.z))
    camera.position.y = EYE_HEIGHT
  })

  return null
}
