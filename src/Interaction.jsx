import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Raycaster, Vector2 } from 'three'

const MAX_DISTANCE = 2.4 // a cuántos metros se puede hablar con More

// Sube por los padres del objeto hasta encontrar un userData.targetId.
// Si algún padre está oculto, no cuenta.
function findTargetId(object) {
  for (let o = object; o; o = o.parent) {
    if (o.visible === false) return null
    if (o.userData?.targetId) return o.userData.targetId
  }
  return null
}

// Lanza un rayo desde el centro de la pantalla (donde está la mirilla).
export default function Interaction({ targetsRef, enabled, onHover, onSelect }) {
  const raycaster = useMemo(() => new Raycaster(undefined, undefined, 0, MAX_DISTANCE), [])
  const center = useMemo(() => new Vector2(0, 0), [])
  const hoveredRef = useRef(null)

  useFrame(({ camera }) => {
    let id = null

    if (enabled && targetsRef.current) {
      raycaster.setFromCamera(center, camera)
      const hits = raycaster.intersectObjects(targetsRef.current.children, true)
      const hit = hits.find((h) => h.object.visible)
      id = hit ? findTargetId(hit.object) : null
    }

    // Solo avisamos a React cuando cambia, no en cada frame
    if (id !== hoveredRef.current) {
      hoveredRef.current = id
      onHover(id)
    }
  })

  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.button === 0 && enabled && hoveredRef.current) {
        onSelect(hoveredRef.current)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [enabled, onSelect])

  return null
}
