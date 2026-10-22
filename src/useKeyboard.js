import { useEffect, useRef } from 'react'

// Devuelve un ref con el estado de las teclas de movimiento.
// Usamos ref (no state) para no re-renderizar en cada pulsación.
export function useKeyboard() {
  const keys = useRef({ forward: false, backward: false, left: false, right: false })

  useEffect(() => {
    const map = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'backward',
      ArrowDown: 'backward',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
    }

    const set = (value) => (e) => {
      const action = map[e.code]
      if (action) keys.current[action] = value
    }

    const onDown = set(true)
    const onUp = set(false)
    const reset = () => {
      Object.keys(keys.current).forEach((k) => (keys.current[k] = false))
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', reset) // evita que quede "pegada" una tecla

    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', reset)
    }
  }, [])

  return keys
}