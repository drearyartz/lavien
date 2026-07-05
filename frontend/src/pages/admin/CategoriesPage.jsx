import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';

const NAME_MAX_LENGTH = 40;

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [newAllowModifiers, setNewAllowModifiers] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingAllowModifiers, setEditingAllowModifiers] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveConfirmId, setSaveConfirmId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await api.post('/categories', { name: newName.trim(), allowModifiers: newAllowModifiers });
      setNewName('');
      setNewAllowModifiers(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingAllowModifiers(!!cat.allow_modifiers);
  }

  async function saveEdit(id) {
    if (!editingName.trim()) return;
    setError('');
    try {
      await api.patch(`/categories/${id}`, { name: editingName.trim(), allowModifiers: editingAllowModifiers });
      setEditingId(null);
      setSaveConfirmId(null);
      load();
    } catch (err) {
      setError(err.message);
      setSaveConfirmId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError('');
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="stack gap-lg">
      <h2>Kategori Yönetimi</h2>
      {error && <div className="error-text">{error}</div>}

      <form className="row gap-sm" style={{ alignItems: 'center' }} onSubmit={handleCreate}>
        <input
          className="input"
          placeholder="Yeni kategori adı"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={NAME_MAX_LENGTH}
          style={{ maxWidth: 320 }}
        />
        <label className="row gap-xs" style={{ alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={newAllowModifiers}
            onChange={(e) => setNewAllowModifiers(e.target.checked)}
          />
          Ekstra Peynir / 1.5 Porsiyon seçenekleri olsun
        </label>
        <button type="submit" className="btn btn-primary">Ekle</button>
      </form>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '1.5rem' }}>Yükleniyor…</p>
        ) : categories.length === 0 ? (
          <p style={{ padding: '1.5rem' }}>Henüz kategori yok.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Kategori Adı</th>
                <th style={{ width: 200 }}>Ekstra Peynir / 1.5 Porsiyon</th>
                <th style={{ width: 220 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
              {categories.map((cat) => (
                <motion.tr
                  key={cat.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.18 }}
                >
                  <td>
                    {editingId === cat.id ? (
                      <input
                        className="input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={NAME_MAX_LENGTH}
                        autoFocus
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td>
                    {editingId === cat.id ? (
                      <input
                        type="checkbox"
                        checked={editingAllowModifiers}
                        onChange={(e) => setEditingAllowModifiers(e.target.checked)}
                      />
                    ) : (
                      <span className="text-secondary">{cat.allow_modifiers ? 'Evet' : 'Hayır'}</span>
                    )}
                  </td>
                  <td>
                    <div className="row gap-xs">
                      {editingId === cat.id ? (
                        <>
                          <button type="button" className="btn" onClick={() => setSaveConfirmId(cat.id)}>
                            Kaydet
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                            Vazgeç
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-ghost" onClick={() => startEdit(cat)}>
                            Yeniden Adlandır
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setDeleteTarget(cat)}
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Kategoriyi sil"
        message={deleteTarget ? `"${deleteTarget.name}" kategorisini silmek istediğinize emin misiniz? Bu kategorideki ürünler de gizlenecektir.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!saveConfirmId}
        title="Değişiklikleri kaydet"
        message={`"${editingName}" olarak kaydetmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Kaydet"
        onConfirm={() => saveEdit(saveConfirmId)}
        onCancel={() => setSaveConfirmId(null)}
      />
    </div>
  );
}
