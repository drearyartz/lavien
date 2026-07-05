import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';

const NAME_MAX_LENGTH = 60;

export default function ProductsPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingPrice, setEditingPrice] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveConfirmId, setSaveConfirmId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [catsRaw, prodsRaw] = await Promise.all([api.get('/categories'), api.get('/products')]);
      const cats = Array.isArray(catsRaw) ? catsRaw : [];
      const prods = Array.isArray(prodsRaw) ? prodsRaw : [];
      setCategories(cats);
      setProducts(prods);
      if (!newCategoryId && cats.length > 0) {
        setNewCategoryId(String(cats[0].id));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function categoryName(id) {
    const c = categories.find((cat) => cat.id === id);
    return c ? c.name : '—';
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim() || !newPrice || !newCategoryId) return;
    setError('');
    try {
      await api.post('/products', {
        categoryId: Number(newCategoryId),
        name: newName.trim(),
        price: Number(newPrice),
      });
      setNewName('');
      setNewPrice('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditingName(p.name);
    setEditingPrice(String(p.price));
    setEditingCategoryId(String(p.category_id));
  }

  async function saveEdit(id) {
    if (!editingName.trim() || !editingPrice || !editingCategoryId) return;
    setError('');
    try {
      await api.patch(`/products/${id}`, {
        name: editingName.trim(),
        price: Number(editingPrice),
        categoryId: Number(editingCategoryId),
      });
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
      await api.delete(`/products/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="stack gap-lg">
      <h2>Ürün Yönetimi</h2>
      {error && <div className="error-text">{error}</div>}

      <form className="row gap-sm wrap" onSubmit={handleCreate}>
        <select
          className="input"
          value={newCategoryId}
          onChange={(e) => setNewCategoryId(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Ürün adı"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={NAME_MAX_LENGTH}
          style={{ maxWidth: 260 }}
        />
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          placeholder="Fiyat (TL)"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          style={{ maxWidth: 140 }}
        />
        <button type="submit" className="btn btn-primary">Ekle</button>
      </form>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '1.5rem' }}>Yükleniyor…</p>
        ) : products.length === 0 ? (
          <p style={{ padding: '1.5rem' }}>Henüz ürün yok.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th style={{ width: 220 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
              {products.map((p) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.18 }}
                >
                  <td>
                    {editingId === p.id ? (
                      <input
                        className="input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={NAME_MAX_LENGTH}
                        autoFocus
                      />
                    ) : (
                      p.name
                    )}
                  </td>
                  <td className="text-secondary">
                    {editingId === p.id ? (
                      <select
                        className="input"
                        value={editingCategoryId}
                        onChange={(e) => setEditingCategoryId(e.target.value)}
                        style={{ maxWidth: 180 }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      categoryName(p.category_id)
                    )}
                  </td>
                  <td>
                    {editingId === p.id ? (
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        style={{ width: 110 }}
                      />
                    ) : (
                      `${p.price.toFixed(2)} TL`
                    )}
                  </td>
                  <td>
                    <div className="row gap-xs">
                      {editingId === p.id ? (
                        <>
                          <button type="button" className="btn" onClick={() => setSaveConfirmId(p.id)}>
                            Kaydet
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                            Vazgeç
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-ghost" onClick={() => startEdit(p)}>
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setDeleteTarget(p)}
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
        title="Ürünü sil"
        message={deleteTarget ? `"${deleteTarget.name}" ürününü silmek istediğinize emin misiniz?` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!saveConfirmId}
        title="Değişiklikleri kaydet"
        message={`"${editingName}" (${editingPrice} TL) olarak kaydetmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Kaydet"
        onConfirm={() => saveEdit(saveConfirmId)}
        onCancel={() => setSaveConfirmId(null)}
      />
    </div>
  );
}
