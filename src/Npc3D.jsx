import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Euler, MathUtils, Quaternion, Vector3, AnimationMixer } from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import CartoonMore from './Character'
import { Chair } from './Decor'

const BASE = import.meta.env.BASE_URL
const NICO_URL = `${BASE}models/nico.glb`
const MORE_URL = `${BASE}models/more.glb`
const DARI_URL = `${BASE}models/dari.glb`
// Sentado: altura de cadera sobre el piso y cuánto se corre hacia atrás del centro de la silla
const SEAT_HIPS = 0.58
const SIT_BACK = -0.06
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b))

// Rota un hueso sobre su pose de animación (se aplica después de mixer.update, cada frame)
const _q = new Quaternion()
const _e = new Euler()
function twist(bone, x, y, z) {
  if (!bone) return
  bone.quaternion.multiply(_q.setFromEuler(_e.set(x, y, z)))
}

// Dobla un hueso hacia adelante/atrás, sin depender de los ejes locales del esqueleto:
// gira alrededor del eje izquierda-derecha del personaje. Ángulo negativo = hacia adelante.
const _axis = new Vector3()
const _wq = new Quaternion()
const _pq = new Quaternion()
const _rq = new Quaternion()
function bend(bone, rootObj, angle) {
  if (!bone || !angle) return
  bone.parent.updateWorldMatrix(true, false)
  rootObj.getWorldQuaternion(_rq)
  bone.getWorldQuaternion(_wq)
  bone.parent.getWorldQuaternion(_pq)
  _axis.set(1, 0, 0).applyQuaternion(_rq)
  _q.setFromAxisAngle(_axis, angle)
  bone.quaternion.copy(_pq.invert().multiply(_q.multiply(_wq)))
}

/**
 * Personaje 3D (GLB de Avaturn, huesos tipo Mixamo).
 * mode: 'idle' | 'talk'
 * seated: sentado en una silla (x, z = centro de la silla; rot = hacia dónde mira)
 */
function Npc3D({ url, id, x, z, rot, mode, seated = false }) {
  const gltf = useGLTF(url)
  const model = useMemo(() => clone(gltf.scene), [gltf.scene])
  const root = useRef()
  const pose = useRef({ t: 0, yaw: rot, headYaw: 0, talk: 0, drop: null })
  const figure = useRef()
  const tmp = useMemo(() => new Vector3(), [])

  // Mixer propio: así los gestos se aplican siempre DESPUÉS de la animación
  const mixer = useMemo(() => new AnimationMixer(model), [model])
  const bones = useMemo(() => {
    const b = {}
    model.traverse((o) => {
      if (o.isBone) b[o.name] = o
      if (o.isMesh) {
        o.castShadow = true
        o.frustumCulled = false
      }
    })
    return b
  }, [model])

  useEffect(() => {
    const clip = gltf.animations[0]
    if (clip) mixer.clipAction(clip).play()
    return () => mixer.stopAllAction()
  }, [mixer, gltf.animations])

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = pose.current
    p.t += dt
    mixer.update(dt)

    const dx = camera.position.x - x
    const dz = camera.position.z - z
    const toPlayer = Math.atan2(dx, dz)
    const facing = mode === 'talk'

    // El cuerpo se gira hacia el jugador cuando conversa.
    // Sentado: la silla gira hasta ±2.6 rad hacia el jugador (no da la vuelta completa)
    const aim = facing ? (seated ? rot + MathUtils.clamp(angleDiff(toPlayer, rot), -2.6, 2.6) : toPlayer) : rot
    p.yaw += angleDiff(aim, p.yaw) * Math.min(1, dt * 6)
    root.current.rotation.y = p.yaw

    // La cabeza sigue al jugador si está cerca
    const near = Math.hypot(dx, dz) < 7
    const rel = near ? MathUtils.clamp(angleDiff(toPlayer, p.yaw), -0.8, 0.8) : 0
    p.headYaw = MathUtils.damp(p.headYaw, rel, 5, dt)
    p.talk = MathUtils.damp(p.talk, mode === 'talk' ? 1 : 0, 5, dt)

    // Si algún gesto sale en el eje equivocado, ajustá los signos / ejes de abajo
    twist(bones.Head, 0, p.headYaw * 0.6, 0)
    twist(bones.Neck, 0, p.headYaw * 0.4, 0)
    if (mode === 'talk') twist(bones.Head, Math.sin(p.t * 5) * 0.04, 0, 0)

    const r = root.current
    if (seated) {
      // Altura de la cadera parada, medida una sola vez: de ahí sale cuánto hay que bajar al personaje
      if (p.drop === null) {
        r.updateWorldMatrix(true, true)
        bones.Hips.getWorldPosition(tmp)
        p.drop = Math.max(0, tmp.y - SEAT_HIPS)
      }
      figure.current.position.set(0, -p.drop, SIT_BACK)
      // Piernas: muslos hacia adelante, pantorrillas hacia abajo, pies planos (orden padre -> hijo)
      for (const side of ['Left', 'Right']) {
        bend(bones[`${side}UpLeg`], r, -1.45)
        bend(bones[`${side}Leg`], r, 1.5)
        bend(bones[`${side}Foot`], r, -0.1)
      }
      twist(bones.Spine, 0.05, 0, 0)
    }
    // Gesticula con el antebrazo derecho mientras habla (sentado, los dos brazos van sobre el escritorio)
    if (seated) {
      bend(bones.LeftArm, r, -0.5)
      bend(bones.LeftForeArm, r, -0.9)
      bend(bones.RightArm, r, -0.5 - p.talk * 0.15)
      bend(bones.RightForeArm, r, -0.9 + p.talk * Math.sin(p.t * 2.4) * 0.3)
    } else bend(bones.RightForeArm, r, p.talk * (-0.9 + Math.sin(p.t * 2.4) * 0.3))
  })

  return (
    // userData.targetId es lo que lee Interaction.jsx para saber a quién apunta el jugador
    <group ref={root} position={[x, 0, z]} rotation-y={rot} userData={{ targetId: id }}>
      {seated && <Chair x={0} z={0} rot={Math.PI} />}
      <group ref={figure}>
        <primitive object={model} />
      </group>
    </group>
  )
}

// Si el .glb falta o falla, la escena sigue (con el reemplazo que se indique, o sin el personaje)
class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.warn('No se pudo cargar un modelo 3D:', err?.message)
  }
  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children
  }
}

export function NicoNpc(props) {
  return (
    <Boundary>
      <Suspense fallback={null}>
        <Npc3D url={NICO_URL} {...props} />
      </Suspense>
    </Boundary>
  )
}

// More: modelo 3D; si more.glb no carga, vuelve a usar el More cartoon (Character.jsx)
export function MoreNpc(props) {
  return (
    <Boundary fallback={<CartoonMore {...props} />}>
      <Suspense fallback={null}>
        <Npc3D url={MORE_URL} {...props} />
      </Suspense>
    </Boundary>
  )
}

// Dari: Training & Learning Head, sentada en su lugar (sin hoja)
export function DariNpc(props) {
  return (
    <Boundary>
      <Suspense fallback={null}>
        <Npc3D url={DARI_URL} {...props} />
      </Suspense>
    </Boundary>
  )
}
