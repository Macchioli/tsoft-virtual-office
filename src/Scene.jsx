import { useMemo } from 'react'
import { NICO, NPC, OFFICES, SIGN_TEXT } from './data'
import { makePaperTexture, makeSignTexture } from './textures'
import { MoreNpc, NicoNpc } from './Npc3D'
import { Ceiling, Lights, PlantWall, Table } from './Decor'
import OfficeAR from './OfficeAR'
import OfficeCL from './OfficeCL'

// Textura de la hoja (con el logo arriba). También la usa Hands.jsx.
export function usePaperTexture() {
  return useMemo(makePaperTexture, [])
}

// Cartel "Cursos obligatorios" sobre el panel de plantas, encima del escritorio
function Sign({ text, panelZ }) {
  const map = useMemo(() => makeSignTexture(text), [text])
  return (
    <group position={[0, 1.45, panelZ]}>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[3.12, 1.12, 0.06]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[3.0, 1.0]} />
        {/* meshBasicMaterial + toneMapped=false: no depende de las luces, se lee parejo a lo lejos */}
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  )
}

// office: 'ar' o 'cl'. Cada oficina trae sus muebles; el rincón de bienvenida (enredadera,
// cartel, escritorio y More) es el mismo en las dos.
export default function Scene({ office, papersRef, paperRef, moreMode, nicoMode = 'idle', paperHidden }) {
  const cfg = OFFICES[office]
  const Office = office === 'cl' ? OfficeCL : OfficeAR
  return (
    <>
      <color attach="background" args={['#cfe0ee']} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      <Ceiling {...cfg.ceiling} room={cfg.room} />
      <Lights list={cfg.lights} />
      <Office />

      {/* Rincón de bienvenida: enredadera con neón, cartel, escritorio y una luz cálida */}
      <PlantWall panelZ={cfg.panelZ} />
      <Table x={cfg.desk.x} z={cfg.desk.z} w={cfg.desk.w} d={cfg.desk.d} />
      <Sign text={SIGN_TEXT} panelZ={cfg.panelZ} />
      <pointLight position={[0, 2.9, cfg.panelZ + 1.4]} intensity={6} distance={8} color="#fff3d6" />

      {/* More y Nico: el grupo es el que recorre el raycaster */}
      <group ref={papersRef}>
        <MoreNpc
          id={NPC.id}
          x={cfg.npc.x}
          z={cfg.npc.z}
          rot={cfg.npc.rot}
          mode={moreMode}
          paperRef={paperRef}
          paperHidden={paperHidden}
        />
        <NicoNpc id={NICO.id} x={cfg.nico.x} z={cfg.nico.z} rot={cfg.nico.rot} mode={nicoMode} />
      </group>
    </>
  )
}
