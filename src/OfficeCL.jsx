import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { DESK_HEIGHT, OFFICES, WALL_HEIGHT, WALL_THICKNESS } from './data'
import {
  makeBeigeCarpetTexture,
  makeChileFlagTexture,
  makeCorridorCarpetTexture,
  makePinwheelTexture,
  makePosterTexture,
  makeSantiagoTexture,
  makeTimelineSignTexture,
} from './textures'
import { Chair, Column, ExitSign, HALF_PI, Laptop, Plant, Wall, WindowWall, rng } from './Decor'

const C = OFFICES.cl
const { room, corridorX: CORRIDOR_X } = C
const GREY = '#d8d8d5' // paredes claras
const WOOD = '#b98d5f' // marcos de madera de las salas vidriadas

// ---------- Pisos: alfombra beige en los escritorios y alfombra oscura en el pasillo ----------
function Floors() {
  const beige = useMemo(makeBeigeCarpetTexture, [])
  const dark = useMemo(makeCorridorCarpetTexture, [])
  const beigeW = CORRIDOR_X + room.w / 2
  const darkW = room.w / 2 - CORRIDOR_X
  beige.repeat.set(beigeW / 2, room.d / 2)
  dark.repeat.set(darkW / 2, room.d / 2)
  return (
    <>
      <mesh rotation-x={-HALF_PI} position={[-room.w / 2 + beigeW / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[beigeW, room.d]} />
        <meshStandardMaterial map={beige} roughness={1} />
      </mesh>
      <mesh rotation-x={-HALF_PI} position={[CORRIDOR_X + darkW / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[darkW, room.d]} />
        <meshStandardMaterial map={dark} roughness={1} />
      </mesh>
    </>
  )
}

// ---------- Mini bandera de escritorio ----------
function MiniFlag({ x, z, map }) {
  return (
    <group position={[x, DESK_HEIGHT, z]}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.32, 6]} />
        <meshStandardMaterial color="#cfd2d6" />
      </mesh>
      <mesh position={[0.07, 0.27, 0]}>
        <planeGeometry args={[0.14, 0.09]} />
        <meshBasicMaterial map={map} side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------- Fila de escritorios blancos con pantallas de vidrio esmerilado ----------
const SEATS = [-3.5, -2.1, -0.7, 0.7, 2.1, 3.5]
const BACKS = ['#2b2e32', '#2b2e32', '#8e9298', '#9b9fa5']
const JACKETS = ['#1e2126', '#23304a', '#2a2a2d', '#3d1f1f']

function Bench({ x, z, len, d, index, flag }) {
  const seats = useMemo(() => {
    const rand = rng(300 + index * 19)
    return [-1, 1].flatMap((s) =>
      SEATS.map((sx) => ({
        s,
        sx,
        chair: rand() > 0.12,
        rot: (rand() - 0.5) * 0.5,
        pull: rand() * 0.12,
        back: BACKS[Math.floor(rand() * BACKS.length)],
        jacket: rand() < 0.2 ? JACKETS[Math.floor(rand() * JACKETS.length)] : null,
        laptop: rand() < 0.7,
        lit: rand() < 0.7,
        headset: rand() < 0.25,
        pad: rand() < 0.2,
        flag: rand() < 0.14,
      }))
    )
  }, [index])
  const top = 0.04
  const metal = { color: '#8b9096', roughness: 0.45, metalness: 0.5 }
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, DESK_HEIGHT - top / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, top, d]} />
        <meshStandardMaterial color="#f4f4f2" roughness={0.45} />
      </mesh>
      {/* Patas de metal gris: un marco en cada punta y uno al medio */}
      {[-len / 2 + 0.15, 0, len / 2 - 0.15].map((fx) => (
        <group key={fx} position={[fx, 0, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, (DESK_HEIGHT - top) / 2, s * (d / 2 - 0.08)]}>
              <boxGeometry args={[0.05, DESK_HEIGHT - top, 0.05]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          ))}
          <mesh position={[0, 0.015, 0]}>
            <boxGeometry args={[0.05, 0.03, d - 0.08]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      ))}
      {/* Pantalla de vidrio esmerilado a lo largo del eje, con abrazaderas cromadas */}
      <mesh position={[0, DESK_HEIGHT + 0.22, 0]}>
        <boxGeometry args={[len - 0.15, 0.44, 0.015]} />
        <meshStandardMaterial color="#cfe6df" transparent opacity={0.72} roughness={0.25} depthWrite={false} />
      </mesh>
      {[-2.8, -1.4, 0, 1.4, 2.8].map((cx) => (
        <mesh key={cx} position={[cx, DESK_HEIGHT + 0.05, 0]}>
          <boxGeometry args={[0.05, 0.1, 0.06]} />
          <meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {/* Tapas de conectividad metálicas */}
      {[-1, 1].flatMap((s) =>
        [-2.1, 0.7].map((px) => (
          <mesh key={`${s}_${px}`} position={[px + 0.35, DESK_HEIGHT + 0.004, s * 0.3]}>
            <boxGeometry args={[0.26, 0.006, 0.09]} />
            <meshStandardMaterial color="#b5b9be" metalness={0.6} roughness={0.35} />
          </mesh>
        ))
      )}

      {seats.map((p, i) => (
        <group key={i}>
          {p.chair && (
            <Chair
              x={p.sx}
              z={p.s * (d / 2 + 0.2 + p.pull)}
              rot={(p.s > 0 ? 0 : Math.PI) + p.rot}
              jacket={p.jacket}
              back={p.back}
            />
          )}
          {p.laptop && <Laptop x={p.sx} z={p.s * 0.5} flip={p.s < 0} lit={p.lit} />}
          {p.headset && (
            <mesh position={[p.sx - 0.34, DESK_HEIGHT + 0.03, p.s * 0.5]}>
              <boxGeometry args={[0.17, 0.05, 0.15]} />
              <meshStandardMaterial color="#17181b" roughness={0.6} />
            </mesh>
          )}
          {p.pad && (
            <mesh position={[p.sx + 0.32, DESK_HEIGHT + 0.003, p.s * 0.5]}>
              <boxGeometry args={[0.2, 0.004, 0.18]} />
              <meshStandardMaterial color="#33a05f" roughness={0.9} />
            </mesh>
          )}
          {flag && p.flag && <MiniFlag x={p.sx + 0.3} z={p.s * 0.55} map={flag} />}
        </group>
      ))}
    </group>
  )
}

// ---------- Cajonera blanca con manijas, al final de cada fila ----------
function Pedestals() {
  return C.pedestals.map((p) => (
    <group key={p.id} position={[p.x, 0, p.z]}>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.w, 0.68, p.d]} />
        <meshStandardMaterial color="#f1f1ef" roughness={0.5} />
      </mesh>
      {[0.22, 0.48].map((y) => (
        <group key={y}>
          <mesh position={[p.w / 2 + 0.001, y, 0]}>
            <boxGeometry args={[0.003, 0.012, p.d - 0.06]} />
            <meshBasicMaterial color="#9c9c98" />
          </mesh>
          <mesh position={[p.w / 2 + 0.012, y + 0.1, 0]}>
            <boxGeometry args={[0.02, 0.025, 0.24]} />
            <meshStandardMaterial color="#3a3d42" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  ))
}

// ---------- Cartelitos colgantes de la historia de la empresa ----------
function TimelineSign({ z, y, year, big, label }) {
  const map = useMemo(() => makeTimelineSignTexture({ year, big, label }), [year, big, label])
  const size = 0.95
  const hang = WALL_HEIGHT - (y + size / 2 - 0.12)
  return (
    <group position={[5.6, y, z]}>
      <mesh>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={map} transparent alphaTest={0.4} side={DoubleSide} toneMapped={false} />
      </mesh>
      {[-0.3, 0.3].map((sx) => (
        <mesh key={sx} position={[sx, size / 2 - 0.12 + hang / 2, 0]}>
          <cylinderGeometry args={[0.004, 0.004, hang, 5]} />
          <meshBasicMaterial color="#d9d9d6" />
        </mesh>
      ))}
    </group>
  )
}

// ---------- Adornos de Fiestas Patrias: guirnaldas de papel y abanicos ----------
const FLAG_COLORS = ['#d52b1e', '#ffffff', '#0039a6']

function Garland({ path }) {
  const items = useMemo(() => {
    const rand = rng(401)
    const out = []
    for (let k = 0; k < path.length - 1; k++) {
      const [x0, y0, z0] = path[k]
      const [x1, y1, z1] = path[k + 1]
      const n = 16
      for (let i = 0; i <= n; i++) {
        const t = i / n
        out.push({
          p: [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * 0.4, z0 + (z1 - z0) * t],
          c: FLAG_COLORS[(i + k) % 3],
          r: rand() * Math.PI,
        })
      }
    }
    return out
  }, [path])
  return items.map((it, i) => (
    <mesh key={i} position={it.p} rotation={[it.r, it.r * 1.7, 0]}>
      <boxGeometry args={[0.11, 0.15, 0.05]} />
      <meshStandardMaterial color={it.c} roughness={0.9} />
    </mesh>
  ))
}

const GARLANDS = [
  [
    [-6.6, 3.35, 9.5],
    [-4.2, 3.35, 6.0],
    [-1.3, 3.35, 3.0],
    [1.8, 3.35, -0.5],
    [4.0, 3.35, -4.0],
    [6.4, 3.35, -7.5],
  ],
  [
    [-7.7, 2.8, 10.5],
    [-7.7, 2.8, 8.2],
    [-7.7, 2.8, 5.9],
    [-7.7, 2.8, 3.6],
  ],
]
const PINWHEELS = [
  [-3.2, 2.85, 5.8],
  [0.4, 2.9, -2.2],
  [-4.6, 2.85, -5.4],
]

function Festive() {
  const wheel = useMemo(makePinwheelTexture, [])
  const flag = useMemo(makeChileFlagTexture, [])
  const hd = room.d / 2
  return (
    <>
      {GARLANDS.map((path, i) => (
        <Garland key={i} path={path} />
      ))}
      {PINWHEELS.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh rotation-y={i * 0.7}>
            <circleGeometry args={[0.36, 24]} />
            <meshBasicMaterial map={wheel} side={DoubleSide} transparent alphaTest={0.5} toneMapped={false} />
          </mesh>
          <mesh position={[0, (WALL_HEIGHT - y) / 2 + 0.18, 0]}>
            <cylinderGeometry args={[0.004, 0.004, WALL_HEIGHT - y - 0.36, 5]} />
            <meshBasicMaterial color="#d9d9d6" />
          </mesh>
        </group>
      ))}
      {/* Bandera de Chile en la pared de entrada */}
      <mesh position={[-2.6, 2.3, hd - 0.11]} rotation-y={Math.PI}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshBasicMaterial map={flag} toneMapped={false} />
      </mesh>
    </>
  )
}

// ---------- Pared derecha: salas con vidrio y marco de madera, pósters y matafuego ----------
function RightWall() {
  const poster = useMemo(makePosterTexture, [])
  const x = room.w / 2
  return (
    <>
      {/* Tabique vidriado con marcos de madera */}
      {[-5, -1.7, 1.6, 5].map((z) => (
        <mesh key={z} position={[x - 0.12, 1.5, z]}>
          <boxGeometry args={[0.1, 3.0, 0.1]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[x - 0.12, 3.0, 0]}>
        <boxGeometry args={[0.1, 0.1, 10.1]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      <mesh position={[x - 0.12, 1.5, 0]} rotation-y={-HALF_PI}>
        <planeGeometry args={[10, 3]} />
        <meshStandardMaterial color="#b9d0d8" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {/* Puerta de madera y vidrio */}
      <mesh position={[x - 0.13, 1.05, 0.05]}>
        <boxGeometry args={[0.06, 2.1, 0.95]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      <mesh position={[x - 0.165, 1.1, 0.05]} rotation-y={-HALF_PI}>
        <planeGeometry args={[0.7, 1.7]} />
        <meshStandardMaterial color="#aebfc6" transparent opacity={0.7} />
      </mesh>
      {/* Pósters */}
      {[9, -8].map((z) => (
        <mesh key={z} position={[x - 0.11, 1.55, z]} rotation-y={-HALF_PI}>
          <planeGeometry args={[0.7, 1.0]} />
          <meshBasicMaterial map={poster} toneMapped={false} />
        </mesh>
      ))}
      {/* Matafuego */}
      <group position={[x - 0.2, 0, -9.2]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.46, 16]} />
          <meshStandardMaterial color="#c8202e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.1, 12]} />
          <meshStandardMaterial color="#1b1c1f" />
        </mesh>
      </group>
    </>
  )
}

// Persianas oscuras bajadas a distintas alturas
const BLINDS = [1.6, 1.2, 1.8, 1.4, 1.0, 1.7, 1.3, 1.5, 1.1, 1.6]

export default function OfficeCL() {
  const hw = room.w / 2
  const hd = room.d / 2
  const y = WALL_HEIGHT / 2
  const flag = useMemo(C.festive ? makeChileFlagTexture : () => null, [])
  return (
    <>
      <Floors />

      {/* Paredes: fondo y frente claras, derecha gris. A la izquierda, ventanal. */}
      <Wall position={[0, y, -hd]} args={[room.w, WALL_HEIGHT, WALL_THICKNESS]} color={GREY} />
      <Wall position={[0, y, hd]} args={[room.w, WALL_HEIGHT, WALL_THICKNESS]} color={GREY} />
      <Wall position={[hw, y, 0]} args={[WALL_THICKNESS, WALL_HEIGHT, room.d]} color="#a9adb1" />
      <Wall position={[-hw, y, -hd + 1.5]} args={[WALL_THICKNESS, WALL_HEIGHT, 3]} color={GREY} />
      <WindowWall
        room={room}
        side="left"
        z0={-9}
        blinds={BLINDS}
        blindColor="#4b4e53"
        frameColor="#d2d4d6"
        sky={makeSantiagoTexture}
      />
      <RightWall />

      {C.columns.map((c) => (
        <Column key={c.id} x={c.x} z={c.z} r={c.r} color="#dcdddd" />
      ))}
      {C.plants.map((p, i) => (
        <Plant key={i} {...p} />
      ))}
      <ExitSign x={5.9} z={hd - 0.5} />

      {C.benches.map((b, i) => (
        <Bench key={b.id} x={b.x} z={b.z} len={b.w} d={b.d} index={i} flag={flag} />
      ))}
      <Pedestals />

      {C.timeline.map((t) => (
        <TimelineSign key={t.label} {...t} />
      ))}
      {C.festive && <Festive />}
    </>
  )
}
