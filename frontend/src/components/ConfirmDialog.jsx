import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmDialog({
  open,
  title = 'Emin misiniz?',
  message,
  confirmLabel = 'Evet, Sil',
  cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          <motion.div
            className="card"
            style={{ maxWidth: 380, width: '90%', boxShadow: 'var(--glow-red-soft)' }}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stack gap-sm">
              <h3>{title}</h3>
              {message && <p>{message}</p>}
              <div className="row gap-sm" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={onCancel}>
                  {cancelLabel}
                </button>
                <button type="button" className="btn btn-danger" onClick={onConfirm}>
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
