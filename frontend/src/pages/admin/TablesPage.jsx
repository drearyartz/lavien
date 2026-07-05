import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import RoleTag from '../../components/RoleTag';
import TableOrderModal from '../../components/TableOrderModal';

const TABLE_NAME_MAX_LENGTH = 20;

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewOrderId, setPreviewOrderId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/tables');
      setTables(Array.isArray(data) ? data : []);
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
      await api.post('/tables', { name: newName.trim() });
      setNewName('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditingName(t.name);
  }

  async function saveEdit(id) {
    if (!editingName.trim()) return;
    setError('');
    try {
      await api.patch(`/tables/${id}`, { name: editingName.trim() });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError('');
    try {
      await api.delete(`/tables/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="stack gap-lg">
      <h2>Masa Yönetimi</h2>
      {error && <div className="error-text">{error}</div>}

      <form className="row gap-sm" onSubmit={handleCreate}>
        <input
          className="input"
          placeholder="Yeni masa adı (örn. Masa 11)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={TABLE_NAME_MAX_LENGTH}
          style={{ maxWidth: 320 }}
        />
        <button type="submit" className="btn btn-primary">Ekle</button>
      </form>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '1.5rem' }}>Yükleniyor…</p>
        ) : tables.length === 0 ? (
          <p style={{ padding: '1.5rem' }}>Henüz masa yok.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Masa Adı</th>
                <th>Durum</th>
                <th style={{ width: 220 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.id}>
                  <td>
                    {editingId === t.id ? (
                      <input
                        className="input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={TABLE_NAME_MAX_LENGTH}
                        autoFocus
                      />
                    ) : (
                      t.name
                    )}
                  </td>
                  <td>
                    <div className="row gap-xs" style={{ alignItems: 'center' }}>
                      <span className="badge">{t.isOccupied ? 'Dolu' : 'Boş'}</span>
                      {t.isOccupied && <RoleTag role={t.openedByRole} channel={t.openedChannel} />}
                      {t.isOccupied && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }}
                          onClick={() => setPreviewOrderId(t.openOrderId)}
                        >
                          İçeriği Görüntüle
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="row gap-xs">
                      {editingId === t.id ? (
                        <>
                          <button type="button" className="btn" onClick={() => saveEdit(t.id)}>
                            Kaydet
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                            Vazgeç
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-ghost" onClick={() => startEdit(t)}>
                            Yeniden Adlandır
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setDeleteTarget(t)}
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Masayı sil"
        message={deleteTarget ? `"${deleteTarget.name}" masasını silmek istediğinize emin misiniz?` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <TableOrderModal orderId={previewOrderId} onClose={() => setPreviewOrderId(null)} />
    </div>
  );
}
