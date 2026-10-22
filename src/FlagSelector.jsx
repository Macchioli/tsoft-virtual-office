import { OFFICES } from './data'

// Estrella de 5 puntas (para la bandera de Chile)
function star(cx, cy, R, r) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const k = i % 2 ? r : R
    return `${(cx + Math.cos(a) * k).toFixed(2)},${(cy + Math.sin(a) * k).toFixed(2)}`
  }).join(' ')
}

function FlagAR() {
  return (
    <svg viewBox="0 0 60 40" className="flag-svg" aria-hidden="true">
      <rect width="60" height="40" fill="#74acdf" />
      <rect y="13.33" width="60" height="13.34" fill="#ffffff" />
      <circle cx="30" cy="20" r="3.4" fill="#f6b40e" stroke="#c98a08" strokeWidth="0.5" />
    </svg>
  )
}

function FlagCL() {
  return (
    <svg viewBox="0 0 60 40" className="flag-svg" aria-hidden="true">
      <rect width="60" height="40" fill="#ffffff" />
      <rect y="20" width="60" height="20" fill="#d52b1e" />
      <rect width="20" height="20" fill="#0039a6" />
      <polygon points={star(10, 10, 6, 2.4)} fill="#ffffff" />
    </svg>
  )
}

const FLAGS = { ar: FlagAR, cl: FlagCL }

// Pantalla de inicio: se elige la oficina haciendo clic en la bandera del país
export default function FlagSelector({ onSelect }) {
  return (
    <div className="selector">
      <h1>Oficina</h1>
      <p>Elegí una oficina para entrar</p>
      <div className="flags">
        {Object.values(OFFICES).map((o) => {
          const Flag = FLAGS[o.id]
          return (
            <button key={o.id} className="flag-btn" onClick={() => onSelect(o.id)}>
              <Flag />
              <span>{o.name}</span>
            </button>
          )
        })}
      </div>
      <p className="selector-hint">WASD para moverte · Mouse para mirar · ESC para salir</p>
    </div>
  )
}
