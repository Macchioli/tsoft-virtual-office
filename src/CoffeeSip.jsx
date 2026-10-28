// Animación de "tomar un café": la taza sube hacia la cara, se inclina y vuelve a bajar.
export default function CoffeeSip() {
  return (
    <div className="coffee-overlay" aria-live="polite">
      <div className="coffee-cup">
        <span className="steam s1" />
        <span className="steam s2" />
        <span className="steam s3" />
        <svg viewBox="0 0 160 140" width="260" height="228" aria-hidden="true">
          <path d="M20 40 h104 v44 a40 40 0 0 1 -40 40 h-24 a40 40 0 0 1 -40 -40 z" fill="#f4f4f2" stroke="#d9d9d6" strokeWidth="3" />
          <path d="M124 52 h12 a16 16 0 0 1 0 32 h-14" fill="none" stroke="#f4f4f2" strokeWidth="9" strokeLinecap="round" />
          <rect x="20" y="40" width="104" height="9" fill="#5a3a26" />
          <path d="M20 78 h104 v8 h-104 z" fill="#d9202f" />
        </svg>
      </div>
      <p className="coffee-text">Un sorbito… ¡qué bien cae un break!</p>
    </div>
  )
}
