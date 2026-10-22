import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BackSide,
  DataTexture,
  MathUtils,
  NearestFilter,
  Quaternion,
  RedFormat,
  Vector3,
} from 'three'
import { DESK_HEIGHT } from './data'
import { usePaperTexture } from './Scene'

const SKIN = '#f4b894'
const SLEEVE = '#3a3d42'
const CUFF = '#f4f4f4'
const OUTLINE = '#1b1b1f'
const OUT = 0.0035 // grosor del contorno, en metros

// Gradiente de 3 tonos: da el sombreado "cel" de dibujito animado
function makeToonGradient() {
  const t = new DataTexture(new Uint8Array([100, 175, 255]), 3, 1, RedFormat)
  t.minFilter = NearestFilter
  t.magFilter = NearestFilter
  t.needsUpdate = true
  return t
}

// Pieza redondeada con contorno negro (casco invertido: la técnica clásica del cartoon).
// shape 'sphere': args = [radio]. shape 'capsule': args = [radio, largo del tramo recto].
function Blob({
  shape,
  args,
  color,
  grad,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const geo = (extra) =>
    shape === 'sphere' ? (
      <sphereGeometry args={[args[0] + extra, 20, 16]} />
    ) : (
      <capsuleGeometry args={[args[0] + extra, args[1], 6, 14]} />
    )
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        {geo(0)}
        <meshToonMaterial color={color} gradientMap={grad} />
      </mesh>
      <mesh>
        {geo(OUT)}
        <meshBasicMaterial color={OUTLINE} side={BackSide} />
      </mesh>
    </group>
  )
}
const FORWARD = new Vector3(0, 0, -1)
const UP = new Vector3(0, 1, 0)
const FINGER_LEN = [1, 1.1, 1.03, 0.85] // índice, mayor, anular, meñique

// Todo en espacio de la cámara: +x derecha, +y arriba, -z hacia adelante.
// El brazo va de un "hombro" fijo (detrás de la cámara) hasta la muñeca.
const SHOULDER = {
  right: new Vector3(0.3, -0.4, 0.3),
  left: new Vector3(-0.3, -0.4, 0.3),
}
const REST = {
  right: new Vector3(0.26, -0.24, -0.5),
  left: new Vector3(-0.26, -0.24, -0.5),
}
const READ = {
  right: new Vector3(0.05, -0.3, -0.5),
  left: new Vector3(-0.16, -0.3, -0.5),
}

const makeRefs = () => ({
  arm: { current: null },
  root: { current: null },
  tilt: { current: null },
  paper: { current: null },
  fingers: { current: [] }, // 0..7 = 4 dedos x 2 falanges, 8 = pulgar
})

function dampVec(v, target, lambda, dt) {
  v.x = MathUtils.damp(v.x, target.x, lambda, dt)
  v.y = MathUtils.damp(v.y, target.y, lambda, dt)
  v.z = MathUtils.damp(v.z, target.z, lambda, dt)
}

function HandModel({ side, refs, paperMap, grad }) {
  return (
    <>
      {/* Manga: cilindro redondeado con contorno. useFrame lo estira de hombro a muñeca. */}
      <group ref={refs.arm}>
        <mesh frustumCulled={false}>
          <cylinderGeometry args={[0.052, 0.078, 1, 24]} />
          <meshToonMaterial color={SLEEVE} gradientMap={grad} />
        </mesh>
        <mesh frustumCulled={false}>
          <cylinderGeometry args={[0.052 + OUT, 0.078 + OUT, 1, 24]} />
          <meshBasicMaterial color={OUTLINE} side={BackSide} />
        </mesh>
      </group>

      {/* La mano apunta hacia -z; la palma mira hacia abajo (-y) */}
      <group ref={refs.root}>
        <group ref={refs.tilt}>
          {/* Puño de camisa */}
          <Blob
            shape="sphere"
            args={[0.058]}
            scale={[1, 1, 0.32]}
            color={CUFF}
            grad={grad}
            position={[0, 0, 0.05]}
          />
          {/* Muñeca */}
          <Blob
            shape="capsule"
            args={[0.034, 0.04]}
            color={SKIN}
            grad={grad}
            position={[0, 0, 0.01]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          {/* Palma redondeada */}
          <Blob
            shape="sphere"
            args={[0.05]}
            scale={[1, 0.62, 1.15]}
            color={SKIN}
            grad={grad}
            position={[0, 0, -0.045]}
          />

          {/* Dedos gorditos de dos falanges */}
          {FINGER_LEN.map((k, i) => {
            const a = 0.045 * k
            const b = 0.036 * k
            const x = side * (-0.036 + 0.024 * i)
            return (
              <group key={i} ref={(el) => (refs.fingers.current[i * 2] = el)} position={[x, 0, -0.09]}>
                <Blob
                  shape="capsule"
                  args={[0.0125, Math.max(a - 0.025, 0.002)]}
                  color={SKIN}
                  grad={grad}
                  position={[0, 0, -a / 2]}
                  rotation={[Math.PI / 2, 0, 0]}
                />
                <group ref={(el) => (refs.fingers.current[i * 2 + 1] = el)} position={[0, 0, -a]}>
                  <Blob
                    shape="capsule"
                    args={[0.0118, Math.max(b - 0.0236, 0.002)]}
                    color={SKIN}
                    grad={grad}
                    position={[0, 0, -b / 2]}
                    rotation={[Math.PI / 2, 0, 0]}
                  />
                </group>
              </group>
            )
          })}

          {/* Pulgar */}
          <group
            ref={(el) => (refs.fingers.current[8] = el)}
            position={[side * -0.05, 0, -0.03]}
            rotation-y={side * 0.55}
          >
            <Blob
              shape="capsule"
              args={[0.0165, 0.03]}
              color={SKIN}
              grad={grad}
              position={[0, 0, -0.03]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>

          {/* Hoja que sostiene la mano derecha (aparece al agarrarla), con borde negro */}
          {side > 0 && (
            <group ref={refs.paper} position={[0, -0.012, -0.29]} visible={false}>
              <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]}>
                <planeGeometry args={[0.44, 0.32]} />
                <meshBasicMaterial color={OUTLINE} />
              </mesh>
              <mesh rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.42, 0.3]} />
                <meshStandardMaterial map={paperMap} />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </>
  )
}

// Coloca brazo + mano: la orientación de la mano sale de la dirección hombro → muñeca
function placeHand(side, refs, pos, tilt, curl, a, tmp) {
  const ph = a.phase + (side > 0 ? 0 : Math.PI)
  const k = a.bob

  // Al caminar las manos avanzan y vuelven (alternadas), con un leve rebote y "respiración"
  tmp.v.copy(pos)
  tmp.v.z -= Math.sin(ph) * 0.05 * a.walk * k
  tmp.v.y += Math.sin(ph * 2) * 0.01 * a.walk * k + Math.sin(a.time * 1.4 + side) * 0.004 * k
  tmp.v.x += Math.cos(ph) * 0.008 * a.walk * k

  const shoulder = side > 0 ? SHOULDER.right : SHOULDER.left
  tmp.dir.copy(tmp.v).sub(shoulder)
  const len = Math.max(tmp.dir.length(), 0.001)
  tmp.dir.divideScalar(len)

  const arm = refs.arm.current
  arm.position.copy(shoulder).addScaledVector(tmp.dir, len / 2)
  arm.quaternion.setFromUnitVectors(UP, tmp.dir)
  arm.scale.y = len

  refs.root.current.position.copy(tmp.v)
  refs.root.current.quaternion.setFromUnitVectors(FORWARD, tmp.dir)
  refs.tilt.current.rotation.x = tilt

  const f = refs.fingers.current
  for (let i = 0; i < 4; i++) {
    if (f[i * 2]) f[i * 2].rotation.x = -curl * 1.1
    if (f[i * 2 + 1]) f[i * 2 + 1].rotation.x = -curl * 1.3
  }
  if (f[8]) f[8].rotation.y = side * (0.55 + 0.5 * curl)
}

/**
 * paper:      hoja que el jugador está agarrando (null = ninguna)
 * busyRef:    ref que esta componente mantiene en true mientras dura la animación
 * onGrabbed:  se llama cuando la hoja ya está levantada frente a la cámara
 * onHidePaper(id | null): oculta / vuelve a mostrar la hoja del escritorio
 */
export default function Hands({ paper, busyRef, onGrabbed, onHidePaper }) {
  const paperMap = usePaperTexture()
  const grad = useMemo(makeToonGradient, [])
  const camRoot = useRef()
  const rightRefs = useMemo(makeRefs, [])
  const leftRefs = useMemo(makeRefs, [])

  const latest = useRef({ paper, onGrabbed, onHidePaper })
  useEffect(() => {
    latest.current = { paper, onGrabbed, onHidePaper }
  })

  const tmp = useMemo(
    () => ({
      v: new Vector3(),
      a: new Vector3(),
      b: new Vector3(),
      c: new Vector3(),
      dir: new Vector3(),
      q: new Quaternion(),
    }),
    []
  )

  const anim = useRef({
    stage: 'rest', // rest → reach → grasp → lift → read → put → return → rest
    t: 0,
    time: 0,
    phase: 0,
    walk: 0,
    bob: 1,
    ready: false,
    data: null,
    last: new Vector3(),
    rPos: REST.right.clone(),
    lPos: REST.left.clone(),
    rTilt: 0,
    lTilt: 0,
    rCurl: 0.25,
    lCurl: 0.25,
    pScale: 0,
  })

  // Importante: Hands va DESPUÉS de <Player /> en el Canvas, así corre luego de mover la cámara
  useFrame((state, delta) => {
    const { camera } = state
    const dt = Math.min(delta, 0.05)
    const a = anim.current
    const { paper: held, onGrabbed: grabbed, onHidePaper: hidePaper } = latest.current

    // Las manos viven en el espacio de la cámara
    camRoot.current.position.copy(camera.position)
    camRoot.current.quaternion.copy(camera.quaternion)

    // Velocidad de caminata, medida por cuánto se movió la cámara
    if (!a.ready) {
      a.last.copy(camera.position)
      a.ready = true
    }
    const speed = camera.position.distanceTo(a.last) / Math.max(dt, 0.0001)
    a.last.copy(camera.position)
    a.walk = MathUtils.damp(a.walk, Math.min(speed / 4.5, 1), 8, dt)
    a.phase += dt * 11 * a.walk
    a.time += dt
    a.t += dt

    const go = (stage) => {
      a.stage = stage
      a.t = 0
    }

    // Arranque / cancelación de la secuencia
    if (held && a.stage === 'rest') {
      a.data = held
      go('reach')
    }
    if (!held && a.stage === 'reach') go('return')
    if (!held && (a.stage === 'grasp' || a.stage === 'lift' || a.stage === 'read')) go('put')

    // Dónde apoyar la mano sobre la hoja (en espacio de cámara)
    const touchPos = tmp.b
    let touchTilt = 0
    if (a.data) {
      tmp.q.copy(camera.quaternion).invert()
      if (a.data.getWorldPosition) a.data.getWorldPosition(tmp.a) // hoja en la mano de More
      else tmp.a.set(a.data.x, DESK_HEIGHT + 0.03, a.data.z) // hoja apoyada en un escritorio
      tmp.a.sub(camera.position).applyQuaternion(tmp.q)
      tmp.dir.copy(tmp.a).sub(SHOULDER.right).normalize()
      // La muñeca queda 0.29 m antes del centro de la hoja: los dedos pellizcan el borde
      touchPos.copy(tmp.a).addScaledVector(tmp.dir, -0.29)
      // Pendiente del brazo en el mundo, para apoyar la mano plana sobre el escritorio
      tmp.c.copy(tmp.dir).applyQuaternion(camera.quaternion)
      touchTilt = -Math.asin(MathUtils.clamp(tmp.c.y, -1, 1))
    }

    let rTarget = REST.right
    let lTarget = REST.left
    let rTilt = 0
    let lTilt = 0
    let rCurl = 0.25
    let lCurl = 0.25
    let lambda = 8

    switch (a.stage) {
      case 'reach':
        rTarget = touchPos
        rTilt = touchTilt
        rCurl = 0
        lambda = 9
        if (a.t > 0.55) go('grasp')
        break
      case 'grasp':
        rTarget = touchPos
        rTilt = touchTilt
        rCurl = 0.7
        lambda = 12
        if (a.t > 0.2) {
          hidePaper(a.data.id)
          go('lift')
        }
        break
      case 'lift':
      case 'read':
        rTarget = READ.right
        rTilt = 1.2
        rCurl = 0.7
        lTarget = READ.left
        lTilt = 0.9
        lCurl = 0.5
        if (a.stage === 'lift' && a.t > 0.6) {
          go('read')
          grabbed(a.data)
        }
        break
      case 'put':
        rTarget = touchPos
        rTilt = touchTilt
        rCurl = 0.7
        if (a.t > 0.55) {
          hidePaper(null)
          go('return')
        }
        break
      case 'return':
        if (a.t > 0.5) go('rest')
        break
      default:
        break
    }

    dampVec(a.rPos, rTarget, lambda, dt)
    dampVec(a.lPos, lTarget, 8, dt)
    a.rTilt = MathUtils.damp(a.rTilt, rTilt, lambda, dt)
    a.lTilt = MathUtils.damp(a.lTilt, lTilt, 8, dt)
    a.rCurl = MathUtils.damp(a.rCurl, rCurl, 14, dt)
    a.lCurl = MathUtils.damp(a.lCurl, lCurl, 10, dt)

    // El balanceo de caminata solo se aplica cuando las manos están libres
    const free = a.stage === 'rest' || a.stage === 'return' ? 1 : 0
    a.bob = MathUtils.damp(a.bob, free, 6, dt)

    placeHand(1, rightRefs, a.rPos, a.rTilt, a.rCurl, a, tmp)
    placeHand(-1, leftRefs, a.lPos, a.lTilt, a.lCurl, a, tmp)

    // Hoja en la mano derecha: crece al agarrarla y se encoge al soltarla
    const inHand = a.stage === 'lift' || a.stage === 'read' || a.stage === 'put'
    a.pScale = MathUtils.damp(a.pScale, inHand ? 1 : 0, inHand ? 14 : 25, dt)
    const pm = rightRefs.paper.current
    pm.visible = a.pScale > 0.03
    pm.scale.setScalar(Math.max(a.pScale, 0.001))

    if (busyRef) busyRef.current = a.stage !== 'rest'
  })

  return (
    <group ref={camRoot}>
      <HandModel side={1} refs={rightRefs} paperMap={paperMap} grad={grad} />
      <HandModel side={-1} refs={leftRefs} paperMap={paperMap} grad={grad} />
    </group>
  )
}
