import { useRef } from 'react'
import { MathUtils, Vector3 } from 'three'
import { useFrame, useThree } from '@react-three/fiber'

// =====================================================================
// Manos en primera persona (detalladas): palma, nudillos, 3 falanges por dedo, pulgar,
// uñas, muñeca y manga de camisa. Están pegadas a la cámara, en reposo, con balanceo al
// caminar y retraso al girar la cámara.
// Tiene que ir DESPUÉS de <Player /> en el Canvas.
// =====================================================================

const SKIN = { color: '#e2ad8b', roughness: 0.55, metalness: 0, emissive: '#4a2a1f', emissiveIntensity: 0.32 }
const NAIL = { color: '#f2d6c9', roughness: 0.3, metalness: 0.05, emissive: '#5a3a30', emissiveIntensity: 0.12 }
const SLEEVE = { color: '#25344a', roughness: 0.85 }
const CUFF = { color: '#f1f2f4', roughness: 0.7 }

// Poses (en el espacio de la cámara: +x derecha, +y arriba, -z adelante)
const IDLE = { pos: [0.2, -0.28, -0.42], rot: [0.28, 0.28, -0.18] }

// ---------- Un dedo: 3 falanges con nudillos. curl 0 = estirado, 1 = cerrado ----------
function Finger({ x, z = -0.092, lens, radius, curl, spread = 0, nail = true, baseRot = 0 }) {
  const j1 = useRef()
  const j2 = useRef()
  const j3 = useRef()
  useFrame(() => {
    const c = curl.current
    if (!j1.current) return
    j1.current.rotation.x = -c * 1.15
    j2.current.rotation.x = -c * 1.35
    j3.current.rotation.x = -c * 0.95
  })
  const r = [radius, radius * 0.92, radius * 0.84]
  const seg = (i, len) => (
    <>
      <mesh position={[0, 0, -len / 2]} rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[r[i], len, 4, 10]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh>
        <sphereGeometry args={[r[i] * 1.02, 10, 8]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
    </>
  )
  return (
    <group position={[x, 0, z]} rotation-y={spread + baseRot}>
      <group ref={j1}>
        {seg(0, lens[0])}
        <group position={[0, 0, -lens[0]]} ref={j2}>
          {seg(1, lens[1])}
          <group position={[0, 0, -lens[1]]} ref={j3}>
            {seg(2, lens[2])}
            {nail && (
              <mesh position={[0, r[2] * 0.82, -lens[2] * 0.62]} scale={[1, 0.28, 1.5]}>
                <sphereGeometry args={[r[2] * 0.78, 10, 8]} />
                <meshStandardMaterial {...NAIL} />
              </mesh>
            )}
            <mesh position={[0, 0, -lens[2]]}>
              <sphereGeometry args={[r[2], 10, 8]} />
              <meshStandardMaterial {...SKIN} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

// ---------- Pulgar: base móvil + 2 falanges ----------
function Thumb({ curl }) {
  const b = useRef()
  const j1 = useRef()
  const j2 = useRef()
  useFrame(() => {
    const c = curl.current
    if (!b.current) return
    b.current.rotation.x = -c * 0.5
    b.current.rotation.z = c * 0.35
    j1.current.rotation.x = -c * 0.9
    j2.current.rotation.x = -c * 0.8
  })
  const R = 0.0105
  return (
    <group position={[-0.04, -0.004, -0.034]} rotation={[0.1, 0.62, -0.25]}>
      <group ref={b}>
        <mesh position={[0, 0, -0.02]} rotation-x={Math.PI / 2}>
          <capsuleGeometry args={[R * 1.08, 0.04, 4, 10]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        <group position={[0, 0, -0.04]} ref={j1}>
          <mesh position={[0, 0, -0.014]} rotation-x={Math.PI / 2}>
            <capsuleGeometry args={[R, 0.028, 4, 10]} />
            <meshStandardMaterial {...SKIN} />
          </mesh>
          <mesh>
            <sphereGeometry args={[R * 1.02, 10, 8]} />
            <meshStandardMaterial {...SKIN} />
          </mesh>
          <group position={[0, 0, -0.03]} ref={j2}>
            <mesh position={[0, 0, -0.011]} rotation-x={Math.PI / 2}>
              <capsuleGeometry args={[R * 0.9, 0.022, 4, 10]} />
              <meshStandardMaterial {...SKIN} />
            </mesh>
            <mesh position={[0, R * 0.8, -0.016]} scale={[1, 0.3, 1.5]}>
              <sphereGeometry args={[R * 0.8, 10, 8]} />
              <meshStandardMaterial {...NAIL} />
            </mesh>
            <mesh position={[0, 0, -0.024]}>
              <sphereGeometry args={[R * 0.9, 10, 8]} />
              <meshStandardMaterial {...SKIN} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

// ---------- Mano derecha completa (la izquierda es la misma con escala x = -1) ----------
function Hand({ curl, thumb }) {
  return (
    <group>
      {/* Palma y dorso */}
      <mesh position={[0, 0, -0.046]} scale={[0.046, 0.017, 0.05]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[0, 0.004, -0.06]} scale={[0.044, 0.014, 0.04]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      {/* Eminencia del pulgar */}
      <mesh position={[-0.03, -0.004, -0.034]} scale={[0.02, 0.014, 0.036]} rotation-y={0.4}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      {/* Dedos: índice, mayor, anular, meñique */}
      <Finger x={-0.0315} z={-0.093} lens={[0.034, 0.022, 0.019]} radius={0.0088} curl={curl} spread={0.05} baseRot={0.03} />
      <Finger x={-0.0105} z={-0.097} lens={[0.037, 0.024, 0.02]} radius={0.0092} curl={curl} spread={0.01} />
      <Finger x={0.0105} z={-0.093} lens={[0.034, 0.022, 0.019]} radius={0.0086} curl={curl} spread={-0.03} />
      <Finger x={0.0305} z={-0.084} lens={[0.027, 0.017, 0.016]} radius={0.0078} curl={curl} spread={-0.09} />
      <Thumb curl={thumb} />
      {/* Muñeca, antebrazo y manga con puño de camisa */}
      <mesh position={[0, 0, 0.02]} rotation-x={Math.PI / 2} scale={[1, 1, 0.8]}>
        <cylinderGeometry args={[0.031, 0.034, 0.07, 16]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[0, 0, 0.1]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.036, 0.04, 0.12, 18]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[0, 0, 0.1]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.046, 0.05, 0.075, 20]} />
        <meshStandardMaterial {...CUFF} />
      </mesh>
      <mesh position={[0, 0, 0.3]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.058, 0.3, 18]} />
        <meshStandardMaterial {...SLEEVE} />
      </mesh>
    </group>
  )
}

export default function Hands() {
  const camera = useThree((s) => s.camera)
  const rig = useRef()
  const rGroup = useRef()
  const lGroup = useRef()
  // Dedos semicerrados en reposo
  const curl = useRef(0.3)
  const thumb = useRef(0.2)

  const st = useRef({
    bob: 0,
    lastPos: new Vector3().copy(camera.position),
    lastYaw: 0,
    lastPitch: 0,
    swayX: 0,
    swayY: 0,
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = st.current

    // Pegado a la cámara
    rig.current.position.copy(camera.position)
    rig.current.quaternion.copy(camera.quaternion)

    // Balanceo al caminar y retraso al girar la cámara
    const speed = camera.position.distanceTo(s.lastPos) / Math.max(dt, 1e-4)
    s.lastPos.copy(camera.position)
    const moving = MathUtils.clamp(speed / 3, 0, 1)
    s.bob += dt * (6 + moving * 4)
    const dYaw = camera.rotation.y - s.lastYaw
    const dPitch = camera.rotation.x - s.lastPitch
    s.lastYaw = camera.rotation.y
    s.lastPitch = camera.rotation.x
    s.swayX = MathUtils.damp(s.swayX, MathUtils.clamp(-Math.atan2(Math.sin(dYaw), Math.cos(dYaw)) * 0.9, -0.05, 0.05), 6, dt)
    s.swayY = MathUtils.damp(s.swayY, MathUtils.clamp(-dPitch * 0.9, -0.04, 0.04), 6, dt)
    const bobY = Math.sin(s.bob) * 0.006 * (0.35 + moving)
    const bobX = Math.cos(s.bob * 0.5) * 0.005 * moving

    rGroup.current.position.set(IDLE.pos[0] + bobX + s.swayX, IDLE.pos[1] + bobY + s.swayY, IDLE.pos[2])
    rGroup.current.rotation.set(IDLE.rot[0], IDLE.rot[1], IDLE.rot[2])
    lGroup.current.position.set(-IDLE.pos[0] + bobX + s.swayX, IDLE.pos[1] - 0.02 + bobY * 0.8 + s.swayY, IDLE.pos[2])
    lGroup.current.rotation.set(IDLE.rot[0], -IDLE.rot[1], -IDLE.rot[2])
  })

  return (
    <group ref={rig}>
      <pointLight position={[0, 0.25, 0.1]} intensity={0.9} distance={1.6} color="#fff3e6" />
      <group ref={rGroup}>
        <Hand curl={curl} thumb={thumb} />
      </group>
      <group ref={lGroup} scale={[-1, 1, 1]}>
        <Hand curl={curl} thumb={thumb} />
      </group>
    </group>
  )
}
