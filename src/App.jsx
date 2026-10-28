import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import Scene from './Scene'
import Player from './Player'
import Hands from './Hands'
import Interaction from './Interaction'
import PaperModal from './PaperModal'
import Dialogue from './Dialogue'
import FlagSelector from './FlagSelector'
import Arcade from './Arcade'
import CoffeeSip from './CoffeeSip'
import {
  DARI,
  DARI_CONTACT,
  DARI_DIALOGUE,
  DIALOGUE,
  DIALOGUE_AGAIN,
  NICO,
  NICO_DIALOGUE,
  NICO_LINK,
  NPC,
  OFFICES,
} from './data'

const PEOPLE = { [NPC.id]: NPC, [NICO.id]: NICO, [DARI.id]: DARI } // a quién se puede hablarle
// Lo que dice la mirilla al apuntar a cada cosa
const HINTS = { coffee: 'Clic para tomar un café', arcade: 'Clic para jugar al Pong' }
const NO_COLLIDERS = []
const NO_ROOM = { w: 16, d: 22 }

// Al entrar a una oficina, ubica al jugador en su punto de arranque mirando hacia el fondo
function CameraStart({ office }) {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    if (!office) return
    const [x, y, z] = OFFICES[office].start
    camera.position.set(x, y, z)
    camera.rotation.set(0, 0, 0)
  }, [office, camera])
  return null
}

export default function App() {
  const controlsRef = useRef()
  const npcRef = useRef() // grupo que recorre el raycaster (More, Nico y Dari)

  const [office, setOffice] = useState(null) // null = pantalla de banderas; 'ar' o 'cl'
  const [locked, setLocked] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const [talking, setTalking] = useState(null) // con quién se está hablando: 'more', 'nico', 'dari' o null
  const [met, setMet] = useState(false) // ya habló con More al menos una vez
  const [openPaper, setOpenPaper] = useState(null) // tarjeta con el modal abierto (Nico o Dari)
  const [drinking, setDrinking] = useState(false) // tomando un café (animación)
  const [playing, setPlaying] = useState(false) // jugando al Pong del arcade

  const cfg = office ? OFFICES[office] : null

  // Clic en una bandera: entra a esa oficina y captura el mouse
  const handleOffice = useCallback((id) => {
    setOffice(id)
    controlsRef.current?.lock() // el clic en la bandera cuenta como gesto del usuario
  }, [])

  // Vuelve a la pantalla de banderas y reinicia todo lo de la oficina anterior
  const changeOffice = useCallback(() => {
    setOffice(null)
    setHoveredId(null)
    setTalking(null)
    setMet(false)
    setOpenPaper(null)
    setDrinking(false)
    setPlaying(false)
  }, [])

  const handleSelect = useCallback((id) => {
    if (id === 'coffee') setDrinking(true)
    else if (id === 'arcade') setPlaying(true)
    else if (PEOPLE[id]) setTalking(id)
  }, [])

  // Terminó el diálogo. Con More: solo queda registrado que ya se conocieron.
  // Con Nico: se abre la tarjeta con el enlace a Tsoft University. Con Dari: la tarjeta con su mail.
  // En los dos casos se suelta el mouse para poder usar el enlace.
  const handleDialogueDone = useCallback(() => {
    const who = talking
    setTalking(null)
    if (who === NPC.id) {
      setMet(true)
    } else if (who === NICO.id) {
      setOpenPaper(NICO_LINK)
      controlsRef.current?.unlock()
    } else if (who === DARI.id) {
      setOpenPaper(DARI_CONTACT)
      controlsRef.current?.unlock()
    }
  }, [talking])

  // Cierra la tarjeta de Nico o de Dari
  const closePaper = useCallback((relock) => {
    setOpenPaper(null)
    if (relock) controlsRef.current?.lock() // el clic en el botón cuenta como gesto del usuario
  }, [])

  useEffect(() => {
    if (!openPaper) return
    const onKey = (e) => {
      if (e.code === 'Escape') closePaper(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPaper, closePaper])

  const moreMode = talking === NPC.id ? 'talk' : 'idle'
  const nicoMode = talking === NICO.id ? 'talk' : 'idle'
  const dariMode = talking === DARI.id ? 'talk' : 'idle'
  const free = locked && !talking && !drinking && !playing

  // La animación del café dura 3,4 s
  useEffect(() => {
    if (!drinking) return
    const id = setTimeout(() => setDrinking(false), 3400)
    return () => clearTimeout(id)
  }, [drinking])

  return (
    <>
      <Canvas shadows camera={{ position: [0, 1.7, 6], fov: 75, near: 0.1, far: 100 }}>
        {office && (
          <Scene
            key={office}
            office={office}
            papersRef={npcRef}
            moreMode={moreMode}
            nicoMode={nicoMode}
            dariMode={dariMode}
          />
        )}
        <CameraStart office={office} />
        <Player
          enabled={free}
          colliders={cfg ? cfg.colliders : NO_COLLIDERS}
          room={cfg ? cfg.room : NO_ROOM}
        />
        {/* Hands tiene que ir después de Player */}
        <Hands />
        <Interaction
          targetsRef={npcRef}
          enabled={free}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />
        <PointerLockControls
          ref={controlsRef}
          onLock={() => setLocked(true)}
          onUnlock={() => {
            setLocked(false)
            setTalking(null) // ESC durante el diálogo lo cierra
            setPlaying(false) // ESC en el arcade también
          }}
        />
      </Canvas>

      {locked && !talking && !drinking && !playing && (
        <>
          <div className={`crosshair ${hoveredId ? 'active' : ''}`} />
          {hoveredId && (
            <div className="hint">
              {HINTS[hoveredId] || `Clic para hablar con ${(PEOPLE[hoveredId] || NPC).name}`}
            </div>
          )}
        </>
      )}

      {talking && (
        <Dialogue
          key={talking}
          speaker={PEOPLE[talking].name}
          lines={
            talking === NICO.id
              ? NICO_DIALOGUE
              : talking === DARI.id
                ? DARI_DIALOGUE
                : met
                  ? DIALOGUE_AGAIN
                  : DIALOGUE
          }
          onDone={handleDialogueDone}
        />
      )}

      {drinking && <CoffeeSip />}
      {playing && <Arcade />}

      {!office && <FlagSelector onSelect={handleOffice} />}

      {office && !locked && !openPaper && (
        <div className="overlay" onClick={() => controlsRef.current?.lock()}>
          <h1>Oficina de {cfg.name}</h1>
          <p>Hacé clic para jugar</p>
          <p>WASD para moverte · Mouse para mirar · ESC para salir</p>
          <button
            className="overlay-btn"
            onClick={(e) => {
              e.stopPropagation()
              changeOffice()
            }}
          >
            Cambiar de oficina
          </button>
        </div>
      )}

      {openPaper && <PaperModal paper={openPaper} onClose={() => closePaper(true)} />}
    </>
  )
}
