import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { DoubleSide, Euler, MathUtils, Quaternion, Vector3, AnimationMixer } from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { makePaperTexture } from './textures'
import CartoonMore from './Character'

const BASE = import.meta.env.BASE_URL
const NICO_URL = `${BASE}models/nico.glb`
const MORE_URL = `${BASE}models/more.glb`
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b))

// Rota un hueso sobre su pose de animación (se aplica después de mixer.update, cada frame)
const _q = new Quaternion()
const _e = new Euler()
function twist(bone, x, y, z) {
  if (!bone) return
  bone.quaternion.multiply(_q.setFromEuler(_e.set(x, y, z)))
}

// Dobla un hueso del brazo hacia adelante/atrás, sin depender de los ejes locales del esqueleto:
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

// Hoja en la mano de More. El grupo (paperRef) es el que leen las manos del jugador.
function Paper({ paperRef, hidden }) {
  const map = useMemo(makePaperTexture, [])
  return (
    <group ref={paperRef} visible={!hidden}>
      <group rotation={[-0.3, 0, 0]}>
        <mesh position={[0, 0, -0.002]}>
          <planeGeometry args={[0.44, 0.32]} />
          <meshBasicMaterial color="#111111" side={DoubleSide} />
        </mesh>
        <mesh>
          <planeGeometry args={[0.42, 0.3]} />
          <meshStandardMaterial map={map} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Personaje 3D (GLB de Avaturn, huesos tipo Mixamo).
 * mode: 'idle' | 'talk' | 'offer'
 * holdsPaper: si true, la mano derecha sostiene la hoja (paperRef) y la estira en 'offer'
 */
function Npc3D({ url, id, x, z, rot, mode, holdsPaper = false, paperRef, paperHidden }) {
  const gltf = useGLTF(url)
  const model = useMemo(() => clone(gltf.scene), [gltf.scene])
  const root = useRef()
  const localPaper = useRef()
  const pose = useRef({ t: 0, yaw: rot, headYaw: 0, talk: 0, offer: 0 })
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
    const facing = mode === 'talk' || mode === 'offer'

    // El cuerpo se gira hacia el jugador cuando conversa o ofrece la hoja
    p.yaw += angleDiff(facing ? toPlayer : rot, p.yaw) * Math.min(1, dt * 6)
    root.current.rotation.y = p.yaw

    // La cabeza sigue al jugador si está cerca
    const near = Math.hypot(dx, dz) < 7
    const rel = near ? MathUtils.clamp(angleDiff(toPlayer, p.yaw), -0.8, 0.8) : 0
    p.headYaw = MathUtils.damp(p.headYaw, rel, 5, dt)
    p.talk = MathUtils.damp(p.talk, mode === 'talk' ? 1 : 0, 5, dt)
    p.offer = MathUtils.damp(p.offer, mode === 'offer' ? 1 : 0, 6, dt)

    // Si algún gesto sale en el eje equivocado, ajustá los signos / ejes de abajo
    twist(bones.Head, 0, p.headYaw * 0.6, 0)
    twist(bones.Neck, 0, p.headYaw * 0.4, 0)
    if (mode === 'talk') twist(bones.Head, Math.sin(p.t * 5) * 0.04, 0, 0)

    const r = root.current
    if (holdsPaper) {
      // Brazo derecho: sostiene la hoja con el antebrazo flexionado; al ofrecerla estira el brazo
      bend(bones.RightArm, r, -0.35 - p.offer * 1.0)
      bend(bones.RightForeArm, r, -1.3 + p.offer * 1.05)
      // Brazo izquierdo: gesticula al hablar
      bend(bones.LeftArm, r, p.talk * -0.35)
      bend(bones.LeftForeArm, r, p.talk * (-0.9 + Math.sin(p.t * 2.4) * 0.3))
    } else {
      // Gesticula con el antebrazo derecho mientras habla
      bend(bones.RightForeArm, r, p.talk * (-0.9 + Math.sin(p.t * 2.4) * 0.3))
    }

    // La hoja sigue a la mano derecha
    if (holdsPaper && bones.RightHand && localPaper.current) {
      root.current.updateWorldMatrix(true, true)
      bones.RightHand.getWorldPosition(tmp)
      root.current.worldToLocal(tmp)
      localPaper.current.position.set(tmp.x, tmp.y + 0.03, tmp.z + 0.11)
    }
  })

  return (
    // userData.targetId es lo que lee Interaction.jsx para saber a quién apunta el jugador
    <group ref={root} position={[x, 0, z]} rotation-y={rot} userData={{ targetId: id }}>
      <primitive object={model} />
      {holdsPaper && (
        <group ref={localPaper}>
          <Paper paperRef={paperRef} hidden={paperHidden} />
        </group>
      )}
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
        <Npc3D url={MORE_URL} holdsPaper {...props} />
      </Suspense>
    </Boundary>
  )
}
