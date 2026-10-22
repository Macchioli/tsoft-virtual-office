import { useCallback, useEffect, useState } from 'react'

// Caja de diálogo con efecto máquina de escribir.
// Avanza con clic, Espacio, Enter o E. El primer avance completa la línea; el segundo pasa a la siguiente.
export default function Dialogue({ speaker, lines, onDone }) {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(0)
  const line = lines[index]
  const finished = shown >= line.length

  useEffect(() => {
    setShown(0)
  }, [line])

  useEffect(() => {
    if (finished) return
    const id = setInterval(() => setShown((n) => n + 1), 28)
    return () => clearInterval(id)
  }, [line, finished])

  const advance = useCallback(() => {
    if (!finished) {
      setShown(line.length)
      return
    }
    if (index + 1 < lines.length) setIndex(index + 1)
    else onDone()
  }, [finished, line, index, lines, onDone])

  useEffect(() => {
    const onMouse = (e) => {
      if (e.button === 0) advance()
    }
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('mousedown', onMouse)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onMouse)
      window.removeEventListener('keydown', onKey)
    }
  }, [advance])

  return (
    <div className="dialogue" role="dialog" aria-live="polite">
      <div className="dialogue-name">{speaker}</div>
      <p className="dialogue-text">{line.slice(0, shown)}</p>
      <div className="dialogue-hint">{finished ? '▼ Clic o Espacio para continuar' : ''}</div>
    </div>
  )
}
