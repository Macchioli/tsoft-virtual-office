import { useMemo } from 'react'
import { DARI, NICO, NPC, OFFICES } from './data'
import { makePaperTexture } from './textures'
import { DariNpc, MoreNpc, NicoNpc } from './Npc3D'
import { Ceiling, Lights, PlantWall } from './Decor'
import OfficeAR from './OfficeAR'
import OfficeCL from './OfficeCL'
import { BreakCorner, BreakTargets } from './Break'

// Textura de la hoja (con el logo arriba). También la usa Hands.jsx.
export function usePaperTexture() {
  return useMemo(makePaperTexture, [])
}

// office: 'ar' o 'cl'. Cada oficina trae sus muebles; la pared del fondo (enredadera con el logo)
// es opcional por oficina: se saca con plantWall: false en su config.
export default function Scene({ office, papersRef, paperRef, moreMode, nicoMode = 'idle', dariMode = 'idle', paperHidden }) {
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

      {/* Pared del fondo: enredadera con el logo de neón (opcional por oficina) */}
      {cfg.plantWall !== false && <PlantWall panelZ={cfg.panelZ} />}

      {/* Rincón del café con arcade, contra la pared del frente */}
      <BreakCorner office={office} />

      {/* More, Nico y Dari, sentados en sus sillas: el grupo es el que recorre el raycaster */}
      <group ref={papersRef}>
        <BreakTargets office={office} />
        <MoreNpc
          id={NPC.id}
          x={cfg.npc.x}
          z={cfg.npc.z}
          rot={cfg.npc.rot}
          seated
          mode={moreMode}
          paperRef={paperRef}
          paperHidden={paperHidden}
        />
        <NicoNpc id={NICO.id} x={cfg.nico.x} z={cfg.nico.z} rot={cfg.nico.rot} seated mode={nicoMode} />
        <DariNpc id={DARI.id} x={cfg.dari.x} z={cfg.dari.z} rot={cfg.dari.rot} seated mode={dariMode} />
      </group>
    </>
  )
}
