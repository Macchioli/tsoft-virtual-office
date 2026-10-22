export default function PaperModal({ paper, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label={paper.title}>
        <img
          className="modal-logo"
          src="/tuniversity-logo.png"
          alt="T University"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <h2>{paper.title}</h2>
        <p>{paper.body}</p>
        <a className="modal-link" href={paper.url} target="_blank" rel="noopener noreferrer">
          Abrir en la plataforma ↗
        </a>
        <button className="modal-close" onClick={onClose}>
          Cerrar y seguir explorando
        </button>
      </div>
    </div>
  )
}
