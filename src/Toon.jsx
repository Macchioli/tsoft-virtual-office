import { useMemo } from 'react'
import { BackSide, DataTexture, NearestFilter, RedFormat } from 'three'

export const OUTLINE = '#1b1b1f'
export const OUT = 0.006 // grosor del contorno, en metros

// Gradiente de 3 tonos: sombreado "cel" de dibujito animado
export function useToonGradient() {
  return useMemo(() => {
    const t = new DataTexture(new Uint8Array([110, 180, 255]), 3, 1, RedFormat)
    t.minFilter = NearestFilter
    t.magFilter = NearestFilter
    t.needsUpdate = true
    return t
  }, [])
}

// Pieza redondeada con contorno negro (casco invertido: la técnica clásica del cartoon).
// shape 'sphere': args = [radio]. shape 'capsule': args = [radio, largo del tramo recto].
export function Blob({
  shape = 'sphere',
  args,
  color,
  grad,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const geo = (extra) =>
    shape === 'sphere' ? (
      <sphereGeometry args={[args[0] + extra, 24, 18]} />
    ) : (
      <capsuleGeometry args={[args[0] + extra, args[1], 6, 16]} />
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
