import { useEffect, useRef } from 'react'
import { H, W, createPong, drawPong, makeSfx, startGame, stepPong } from './pong'

// Pantalla de juego: Pong de Tsoft contra la máquina. W/S, flechas o mouse para mover. ESC para salir.
export default function Arcade() {
  const ref = useRef()

  useEffect(() => {
    const g = ref.current.getContext('2d')
    const game = createPong()
    startGame(game)
    const sfx = makeSfx()
    const keys = new Set()
    let mouse = 0
    let last = performance.now()
    let raf

    const restart = () => {
      if (game.mode === 'over') startGame(game)
    }
    const onKeyDown = (e) => {
      keys.add(e.code)
      if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault()
      if (e.code === 'Space' || e.code === 'Enter') restart()
    }
    const onKeyUp = (e) => keys.delete(e.code)
    const onMove = (e) => {
      mouse += e.movementY || 0
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', restart)

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const axis =
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0)
      stepPong(game, dt, { axis, delta: mouse * 0.45 }, sfx)
      mouse = 0
      drawPong(g, game)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', restart)
    }
  }, [])

  return (
    <div className="arcade-overlay">
      <div className="arcade-cabinet">
        <canvas ref={ref} width={W} height={H} className="arcade-canvas" />
      </div>
      <p className="arcade-help">W / S, flechas o mouse para mover · el primero en llegar a 7 gana · ESC para salir</p>
    </div>
  )
}
