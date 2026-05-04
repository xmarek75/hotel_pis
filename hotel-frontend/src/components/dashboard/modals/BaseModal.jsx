export default function BaseModal({ children, title, onClose }) {
  return (
    <div className="reservation-modal-backdrop" onClick={onClose}>
      <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa pokoje">
        <header className="reservation-modal__head">
          <h3>{title}</h3>
          <button className="btn btn--secondary btn--compact" type="button" onClick={onClose}>
            Zavřít
          </button>
        </header>

        {children}

      </section>
    </div>
  );
}