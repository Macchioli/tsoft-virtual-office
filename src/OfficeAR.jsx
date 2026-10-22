import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { DESK_HEIGHT, OFFICES, WALL_HEIGHT, WALL_THICKNESS } from './data'
import {
  makeCarpetTexture,
  makeCubeTexture,
  makeDeskTexture,
  makeFlagTexture,
  makeLockerTexture,
  makePosterTexture,
  makeRollupTexture,
  makeSkylineTexture,
  makeSlatTexture,
  makeStickerTexture,
  makeStoneTexture,
  makeTileTexture,
} from './textures'
import { Chair, Column, ExitSign, HALF_PI, Laptop, Plant, Table, Wall, WindowWall, rng } from './Decor'

const A = OFFICES.ar
const { room, panelZ: PANEL_Z, corridorX: CORRIDOR_X } = A
const SLATE = '#34414c' // gris azulado oscuro de la pared del fondo

// ---------- Pisos: baldosones en el pasillo y alfombra en el sector de escritorios ----------
function Floors() {
  const tile = useMemo(makeTileTexture, [])
  const carpet = useMemo(makeCarpetTexture, [])
  const tileW = CORRIDOR_X + room.w / 2
  const carpetW = room.w / 2 - CORRIDOR_X
  tile.repeat.set(tileW / 1.8, room.d / 1.8)
  carpet.repeat.set(carpetW / 2, room.d / 2)
  return (
    <>
      <mesh rotation-x={-HALF_PI} position={[-room.w / 2 + tileW / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[tileW, room.d]} />
        <meshStandardMaterial map={tile} roughness={0.55} />
      </mesh>
      <mesh rotation-x={-HALF_PI} position={[CORRIDOR_X + carpetW / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[carpetW, room.d]} />
        <meshStandardMaterial map={carpet} roughness={1} />
      </mesh>
      {/* Perfil metálico en la unión de los dos pisos */}
      <mesh position={[CORRIDOR_X, 0.006, 0]}>
        <boxGeometry args={[0.05, 0.012, room.d]} />
        <meshStandardMaterial color="#8c9094" metalness={0.5} roughness={0.4} />
      </mesh>
    </>
  )
}

// ---------- Pared de lockers numerados (sobre la pared izquierda) ----------
function Lockers() {
  const { z0, cols, rows, cellW, cellH, depth } = A.lockers
  const map = useMemo(() => makeLockerTexture(cols, rows), [cols, rows])
  const len = cols * cellW
  const h = rows * cellH
  const base = 0.1
  const wallFace = -room.w / 2 + 0.1 // cara interior de la pared izquierda
  const zc = z0 - len / 2
  return (
    <group position={[wallFace, 0, zc]}>
      {/* Cuerpo blanco de los lockers y zócalo oscuro */}
      <mesh position={[depth / 2, base + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[depth, h, len]} />
        <meshStandardMaterial color="#eceae5" roughness={0.6} />
      </mesh>
      <mesh position={[depth / 2 - 0.03, base / 2, 0]}>
        <boxGeometry args={[depth - 0.06, base, len]} />
        <meshStandardMaterial color="#3a3b3e" />
      </mesh>
      <mesh position={[depth / 2, base + h + 0.04, 0]}>
        <boxGeometry args={[depth + 0.04, 0.08, len + 0.04]} />
        <meshStandardMaterial color="#f4f3ef" roughness={0.6} />
      </mesh>
      {/* Frente con las puertas numeradas (el número 1 arranca del lado de la entrada) */}
      <mesh position={[depth + 0.002, base + h / 2, 0]} rotation-y={HALF_PI}>
        <planeGeometry args={[len, h]} />
        <meshStandardMaterial map={map} roughness={0.55} />
      </mesh>
    </group>
  )
}

// ---------- Rincón lounge: listones de madera, piedra, mesa, pufs y póster ----------
function Lounge() {
  const slats = useMemo(makeSlatTexture, [])
  const stone = useMemo(makeStoneTexture, [])
  const poster = useMemo(makePosterTexture, [])
  const wallIn = -room.d / 2 + 0.1
  const { table, poufs } = A.nook
  return (
    <>
      {/* Panel de listones sobre la pared del fondo */}
      <mesh position={[-6.1, 1.65, wallIn + 0.03]}>
        <boxGeometry args={[3.2, 3.3, 0.06]} />
        <meshStandardMaterial map={slats} roughness={0.7} />
      </mesh>
      {/* Revestimiento de piedra sobre la pared izquierda del rincón */}
      <mesh position={[-room.w / 2 + 0.14, WALL_HEIGHT / 2, -9.25]}>
        <boxGeometry args={[0.08, WALL_HEIGHT, 3.3]} />
        <meshStandardMaterial map={stone} roughness={0.9} />
      </mesh>
      {/* Póster enmarcado */}
      <mesh position={[-6.1, 1.7, wallIn + 0.075]}>
        <boxGeometry args={[0.56, 0.78, 0.03]} />
        <meshStandardMaterial color="#111114" />
      </mesh>
      <mesh position={[-6.1, 1.7, wallIn + 0.092]}>
        <planeGeometry args={[0.5, 0.72]} />
        <meshBasicMaterial map={poster} toneMapped={false} />
      </mesh>
      <Table x={table.x} z={table.z} w={table.w} d={table.d} legColor="#1c1d20" />
      {poufs.map((p, i) => (
        <mesh key={i} position={[p.x, 0.21, p.z]} castShadow>
          <cylinderGeometry args={[p.r, p.r + 0.02, 0.42, 28]} />
          <meshStandardMaterial color="#6b6f75" roughness={1} />
        </mesh>
      ))}
    </>
  )
}

// ---------- Bandera "gota" con el logo, sobre pie en cruz ----------
function Flag({ x, z, rot = 0 }) {
  const map = useMemo(makeFlagTexture, [])
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      {[0, HALF_PI].map((r) => (
        <mesh key={r} position={[0, 0.02, 0]} rotation-y={r}>
          <boxGeometry args={[0.7, 0.03, 0.06]} />
          <meshStandardMaterial color="#17181b" />
        </mesh>
      ))}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 2.6, 8]} />
        <meshStandardMaterial color="#17181b" />
      </mesh>
      {/* Plano de 0,6 x 2,4 m: el borde izquierdo es el mástil */}
      <mesh position={[0.3, 1.38, 0]}>
        <planeGeometry args={[0.6, 2.4]} />
        <meshBasicMaterial map={map} transparent alphaTest={0.5} side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------- Detalles del fondo: banderas, cajas del logo, roll-up y plantas ----------
function BackProps() {
  const cube = useMemo(makeCubeTexture, [])
  const rollup = useMemo(makeRollupTexture, [])
  const { cubes, plants } = A
  return (
    <>
      <Flag x={-3.2} z={PANEL_Z + 0.65} rot={0.12} />
      <Flag x={3.45} z={PANEL_Z + 0.65} rot={-0.12} />

      <mesh position={[cubes.x, 0.25, cubes.z]} rotation-y={0.18} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial map={cube} />
      </mesh>
      <mesh position={[cubes.x + 0.03, 0.7, cubes.z]} rotation-y={0.5} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial map={cube} />
      </mesh>

      <group position={[-4.65, 0, PANEL_Z + 1.0]} rotation-y={0.2}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.55, 0.04, 0.14]} />
          <meshStandardMaterial color="#2b2d31" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <planeGeometry args={[0.5, 1.5]} />
          <meshBasicMaterial map={rollup} side={DoubleSide} toneMapped={false} />
        </mesh>
      </group>

      {plants.map((p, i) => (
        <Plant key={i} {...p} />
      ))}
    </>
  )
}

// ---------- Stickers del piso ----------
function Sticker({ x, z, rot, text, sub }) {
  const map = useMemo(() => makeStickerTexture(text, sub), [text, sub])
  return (
    <mesh position={[x, 0.008, z]} rotation={[-HALF_PI, 0, rot]}>
      <planeGeometry args={[1.0, 1.0]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

// ---------- Fila de escritorios tipo bench con sillas, notebooks, termos y mates ----------
const SEATS = [-3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9]
const JACKETS = ['#1e2126', '#23304a', '#2a2a2d', '#3d1f1f', '#1e2126']

function Bench({ x, z, len, d, index }) {
  const wood = useMemo(() => makeDeskTexture([len / 1.2, d / 1.2]), [len, d])
  const seats = useMemo(() => {
    const rand = rng(200 + index * 17)
    return [-1, 1].flatMap((s) =>
      SEATS.map((sx) => ({
        s,
        sx,
        chair: rand() > 0.1,
        rot: (rand() - 0.5) * 0.5,
        pull: rand() * 0.12,
        jacket: rand() < 0.3 ? JACKETS[Math.floor(rand() * JACKETS.length)] : null,
        laptop: rand() < 0.75,
        lit: rand() < 0.7,
        thermos: rand() < 0.3,
        mate: rand() < 0.3,
      }))
    )
  }, [index])
  const top = 0.04
  const metal = { color: '#17181b', roughness: 0.5, metalness: 0.4 }
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, DESK_HEIGHT - top / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, top, d]} />
        <meshStandardMaterial map={wood} roughness={0.6} />
      </mesh>
      {/* Bandeja de cables negra al medio */}
      <mesh position={[0, DESK_HEIGHT + 0.004, 0]}>
        <boxGeometry args={[len - 0.8, 0.012, 0.11]} />
        <meshStandardMaterial color="#1b1c1f" roughness={0.6} />
      </mesh>
      {/* Marcos de patas negras: uno en cada punta y uno al medio */}
      {[-len / 2 + 0.2, 0, len / 2 - 0.2].map((fx) => (
        <group key={fx} position={[fx, 0, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, (DESK_HEIGHT - top) / 2, s * (d / 2 - 0.1)]}>
              <boxGeometry args={[0.045, DESK_HEIGHT - top, 0.045]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          ))}
          <mesh position={[0, 0.015, 0]}>
            <boxGeometry args={[0.05, 0.03, d - 0.1]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      ))}
      {/* Mamparas oscuras en las dos puntas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (len / 2 - 0.02), DESK_HEIGHT + 0.25, 0]}>
          <boxGeometry args={[0.03, 0.5, d - 0.05]} />
          <meshStandardMaterial color="#2a2c30" roughness={0.8} />
        </mesh>
      ))}

      {seats.map((p, i) => (
        <group key={i}>
          {p.chair && (
            <Chair
              x={p.sx}
              z={p.s * (d / 2 + 0.2 + p.pull)}
              rot={(p.s > 0 ? 0 : Math.PI) + p.rot}
              jacket={p.jacket}
            />
          )}
          {p.laptop && <Laptop x={p.sx} z={p.s * 0.42} flip={p.s < 0} lit={p.lit} />}
          {p.thermos && (
            <mesh position={[p.sx + 0.34, DESK_HEIGHT + 0.14, p.s * 0.52]}>
              <cylinderGeometry args={[0.04, 0.04, 0.28, 12]} />
              <meshStandardMaterial color="#e8ebed" metalness={0.3} roughness={0.4} />
            </mesh>
          )}
          {p.mate && (
            <mesh position={[p.sx - 0.34, DESK_HEIGHT + 0.045, p.s * 0.5]}>
              <cylinderGeometry args={[0.045, 0.035, 0.09, 12]} />
              <meshStandardMaterial color="#6b4a2b" roughness={0.8} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// ---------- Bancos blancos con almohadón rojo, entre fila y fila ----------
function Storage() {
  return A.storage.map((s) => {
    const modules = Math.floor(s.w)
    return (
      <group key={s.id} position={[s.x, 0, s.z]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[s.w, 0.44, s.d]} />
          <meshStandardMaterial color="#f1f0ec" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.475, 0]}>
          <boxGeometry args={[s.w - 0.02, 0.07, s.d - 0.03]} />
          <meshStandardMaterial color="#d9202f" roughness={0.85} />
        </mesh>
        {/* Rendijas entre módulos, de los dos lados */}
        {[-1, 1].flatMap((side) =>
          Array.from({ length: modules - 1 }, (_, i) => (
            <mesh
              key={`${side}_${i}`}
              position={[-s.w / 2 + ((i + 1) * s.w) / modules, 0.22, (side * s.d) / 2 + side * 0.001]}
            >
              <boxGeometry args={[0.01, 0.42, 0.002]} />
              <meshBasicMaterial color="#9a9a96" />
            </mesh>
          ))
        )}
      </group>
    )
  })
}

// Persianas roller a distintas alturas
const BLINDS = [0.9, 1.3, 0.8, 1.6, 1.0, 1.1, 0.7, 1.4, 1.0]

export default function OfficeAR() {
  const hw = room.w / 2
  const hd = room.d / 2
  const y = WALL_HEIGHT / 2
  const solidLen = 2.4 // tramo macizo de la pared derecha, entre el ventanal y el fondo
  return (
    <>
      <Floors />

      {/* Paredes: fondo gris azulado, frente y izquierda blancas. A la derecha, ventanal. */}
      <Wall position={[0, y, -hd]} args={[room.w, WALL_HEIGHT, WALL_THICKNESS]} color={SLATE} />
      <Wall position={[0, y, hd]} args={[room.w, WALL_HEIGHT, WALL_THICKNESS]} />
      <Wall position={[-hw, y, 0]} args={[WALL_THICKNESS, WALL_HEIGHT, room.d]} />
      <Wall position={[hw, y, -hd + solidLen / 2]} args={[WALL_THICKNESS, WALL_HEIGHT, solidLen]} color={SLATE} />
      <WindowWall room={room} side="right" z0={-8.6} blinds={BLINDS} sky={makeSkylineTexture} />

      <Lockers />
      <Lounge />
      <BackProps />
      <Column {...A.column} />
      {A.stickers.map((s, i) => (
        <Sticker key={i} {...s} />
      ))}
      <ExitSign x={-5.8} z={hd - 0.5} />

      {A.benches.map((b, i) => (
        <Bench key={b.id} x={b.x} z={b.z} len={b.w} d={b.d} index={i} />
      ))}
      <Storage />
    </>
  )
}
