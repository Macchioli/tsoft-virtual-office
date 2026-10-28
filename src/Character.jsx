import { useMemo, useRef } from 'react'
import { MathUtils } from 'three'
import { useFrame } from '@react-three/fiber'
import { Blob, useToonGradient } from './Toon'
import { makeFaceTexture } from './textures'

const SKIN = '#e9b595'
const HAIR = '#2a1a12'
const TOP = '#dba43f' // top mostaza
const CARDI = '#efe8da' // cárdigan crema
const PANTS = '#2f3542'
const SHOE = '#f4f4f4'
const HALF_PI = Math.PI / 2

const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b))

// Rulos del costado del pelo, en el espacio de la cabeza: [x, y, z, radio] (se espejan en X)
const SIDE_CURLS = [
  [0.2, -0.02, 0.0, 0.055],
  [0.215, -0.13, 0.02, 0.06],
  [0.2, -0.26, 0.045, 0.058],
  [0.17, -0.38, 0.06, 0.055],
  [0.13, -0.47, 0.07, 0.05],
]
// Rulos de arriba de la cabeza (se espejan en X)
const TOP_CURLS = [
  [0.12, 0.17, -0.01, 0.06],
  [0.17, 0.09, 0.0, 0.055],
  [0.0, 0.21, -0.03, 0.06],
]

// Brazo con codo. El eje del brazo es -y: rotar en x con valores negativos lo levanta hacia adelante.
function Arm({ x, armRef, elbowRef, grad, children }) {
  return (
    <group ref={armRef} position={[x, 1.2, 0]} rotation-z={x < 0 ? -0.1 : 0.1}>
      <Blob shape="sphere" args={[0.062]} color={CARDI} grad={grad} />
      <Blob shape="capsule" args={[0.052, 0.2]} color={CARDI} grad={grad} position={[0, -0.16, 0]} />
      <group ref={elbowRef} position={[0, -0.32, 0]}>
        <Blob shape="capsule" args={[0.047, 0.14]} color={CARDI} grad={grad} position={[0, -0.12, 0]} />
        <Blob shape="sphere" args={[0.056]} color={SKIN} grad={grad} position={[0, -0.29, 0]} />
        <Blob
          shape="sphere"
          args={[0.026]}
          color={SKIN}
          grad={grad}
          position={[x < 0 ? 0.04 : -0.04, -0.27, 0.04]}
        />
        {children}
      </group>
    </group>
  )
}

/**
 * x, z, rot: posición y orientación base (en el mundo)
 * mode: 'idle' | 'talk'  (esperando / conversando)
 */
export default function More({ id, x, z, rot, mode }) {
  const grad = useToonGradient()
  const faceMap = useMemo(makeFaceTexture, [])

  const root = useRef()
  const torso = useRef()
  const head = useRef()
  const armR = useRef()
  const elbowR = useRef()
  const armL = useRef()
  const elbowL = useRef()
  const pose = useRef({ t: 0, yaw: rot, shR: -0.5, elR: -1.2, shL: 0.05, elL: -0.15, headYaw: 0 })

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = pose.current
    p.t += dt
    const t = p.t

    // Poses objetivo según lo que esté haciendo
    let shR = -0.5 // brazo derecho: flexionado a la altura del pecho
    let elR = -1.2
    let shL = 0.05
    let elL = -0.15
    let face = false
    if (mode === 'talk') {
      face = true
      shL = -0.75 + Math.sin(t * 2.4) * 0.25 // gesticula con la mano izquierda
      elL = -0.9 + Math.sin(t * 2.4 + 1) * 0.3
      shR = -0.5 + Math.sin(t * 1.6) * 0.05
    }
    p.shR = MathUtils.damp(p.shR, shR, 6, dt)
    p.elR = MathUtils.damp(p.elR, elR, 6, dt)
    p.shL = MathUtils.damp(p.shL, shL, 6, dt)
    p.elL = MathUtils.damp(p.elL, elL, 6, dt)
    armR.current.rotation.x = p.shR
    elbowR.current.rotation.x = p.elR
    armL.current.rotation.x = p.shL
    elbowL.current.rotation.x = p.elL

    // El cuerpo se gira hacia el jugador cuando conversa
    const dx = camera.position.x - x
    const dz = camera.position.z - z
    const toPlayer = Math.atan2(dx, dz)
    const target = face ? toPlayer : rot
    p.yaw += angleDiff(target, p.yaw) * Math.min(1, dt * 6)
    root.current.rotation.y = p.yaw

    // La cabeza sigue al jugador si está cerca
    const near = Math.hypot(dx, dz) < 7
    const rel = near ? MathUtils.clamp(angleDiff(toPlayer, p.yaw), -0.9, 0.9) : 0
    p.headYaw = MathUtils.damp(p.headYaw, rel, 5, dt)
    head.current.rotation.y = p.headYaw
    head.current.rotation.x = mode === 'talk' ? Math.sin(t * 5) * 0.05 : 0
    head.current.rotation.z = Math.sin(t * 0.8) * 0.025

    // Respiración
    torso.current.scale.y = 1 + Math.sin(t * 1.6) * 0.01
  })

  return (
    // userData.targetId es lo que lee Interaction.jsx para saber a quién apunta el jugador
    <group ref={root} position={[x, 0, z]} rotation-y={rot} userData={{ targetId: id }}>
      {/* Sombra en el piso */}
      <mesh rotation-x={-HALF_PI} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.42, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Piernas y zapatillas (no se veían en la foto: pantalón oscuro y zapatillas blancas) */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Blob shape="capsule" args={[0.065, 0.5]} color={PANTS} grad={grad} position={[s * 0.085, 0.4, 0]} />
          <Blob
            shape="sphere"
            args={[0.075]}
            scale={[1, 0.65, 1.55]}
            color={SHOE}
            grad={grad}
            position={[s * 0.085, 0.055, 0.035]}
          />
        </group>
      ))}

      {/* Torso: top mostaza, con el cárdigan crema abierto (parte de atrás + dos solapas) */}
      <group ref={torso}>
        <Blob shape="capsule" args={[0.15, 0.24]} scale={[1, 1, 0.72]} color={TOP} grad={grad} position={[0, 1.0, 0]} />
        <Blob shape="capsule" args={[0.165, 0.22]} scale={[1.02, 1, 0.7]} color={CARDI} grad={grad} position={[0, 1.0, -0.045]} />
        {[-1, 1].map((s) => (
          <Blob
            key={s}
            shape="capsule"
            args={[0.072, 0.36]}
            scale={[1, 1, 0.8]}
            color={CARDI}
            grad={grad}
            position={[s * 0.128, 0.99, 0.065]}
            rotation={[0, 0, s * 0.05]}
          />
        ))}
      </group>

      {/* Cuello */}
      <Blob shape="capsule" args={[0.04, 0.06]} color={SKIN} grad={grad} position={[0, 1.31, 0]} />

      {/* Cabeza */}
      <group ref={head} position={[0, 1.47, 0]}>
        <group scale={[1, 1.06, 0.98]}>
          <Blob shape="sphere" args={[0.17]} color={SKIN} grad={grad} />
          {/* Parche curvo con la cara dibujada (ojos, cejas, nariz, sonrisa, cachetes) */}
          <mesh>
            <sphereGeometry args={[0.1715, 32, 24, HALF_PI - 0.7, 1.4, 1.05, 1.0]} />
            <meshBasicMaterial map={faceMap} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
        </group>

        {/* Pelo largo, oscuro, ondulado y voluminoso, con raya al medio */}
        <Blob shape="sphere" args={[0.188]} scale={[1, 1.02, 1]} color={HAIR} grad={grad} position={[0, 0.035, -0.03]} />
        <Blob shape="sphere" args={[0.2]} scale={[1.05, 1.55, 0.85]} color={HAIR} grad={grad} position={[0, -0.17, -0.09]} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Blob shape="capsule" args={[0.055, 0.26]} color={HAIR} grad={grad} position={[s * 0.178, -0.2, 0.02]} />
            {SIDE_CURLS.map(([cx, cy, cz, r], i) => (
              <Blob key={`s${i}`} shape="sphere" args={[r]} color={HAIR} grad={grad} position={[s * cx, cy, cz]} />
            ))}
            {TOP_CURLS.map(([cx, cy, cz, r], i) => (
              <Blob key={`t${i}`} shape="sphere" args={[r]} color={HAIR} grad={grad} position={[s * cx, cy, cz]} />
            ))}
            {/* Flequillo a los dos lados de la raya */}
            <Blob
              shape="sphere"
              args={[0.062]}
              scale={[1.3, 0.8, 0.8]}
              color={HAIR}
              grad={grad}
              position={[s * 0.085, 0.115, 0.095]}
              rotation={[0, 0, s * -0.5]}
            />
          </group>
        ))}
      </group>

      {/* Brazo derecho de More (lado -x) */}
      <Arm x={-0.215} armRef={armR} elbowRef={elbowR} grad={grad} />

      {/* Brazo izquierdo (lado +x) */}
      <Arm x={0.215} armRef={armL} elbowRef={elbowL} grad={grad} />
    </group>
  )
}
