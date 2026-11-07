import { useProgress } from '@react-three/drei'

// Barra fina de progreso mientras bajan los modelos. Desaparece al llegar al 100 %.
export default function Loader() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader-label">Cargando la oficina… {Math.round(progress)}%</div>
      <div className="loader-bar">
        <div className="loader-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
