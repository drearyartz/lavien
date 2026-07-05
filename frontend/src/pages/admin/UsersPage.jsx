import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import RoleTag from '../../components/RoleTag';
import RoleTypeSelect from '../../components/RoleTypeSelect';

const USERNAME_MAX_LENGTH = 30;
const DISPLAY_NAME_MAX_LENGTH = 40;

const emptyForm = { username: '', password: '', displayName: '', role: 'personel' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(Array.isArray(data) ? data : []);
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
    if (!form.username.trim() || !form.password || !form.displayName.trim()) return;
    setError('');
    try {
      await api.post('/users', form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(u) {
    setEditingId(u.id);
    setEditForm({ username: u.username, password: '', displayName: u.displayName, role: u.role });
  }

  async function saveEdit(id) {
    if (!editForm.username.trim() || !editForm.displayName.trim()) return;
    setError('');
    try {
      await api.patch(`/users/${id}`, editForm);
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
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="stack gap-lg">
      <h2>Kullanıcı Yönetimi</h2>
      {error && <div className="error-text">{error}</div>}

      <form className="row gap-sm wrap" onSubmit={handleCreate} style={{ alignItems: 'flex-end' }}>
        <div className="field">
          <label htmlFor="new-username">Kullanıcı Adı</label>
          <input
            id="new-username"
            className="input"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            maxLength={USERNAME_MAX_LENGTH}
            style={{ maxWidth: 180 }}
          />
        </div>
        <div className="field">
          <label htmlFor="new-password">Şifre</label>
          <input
            id="new-password"
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            style={{ maxWidth: 160 }}
          />
        </div>
        <div className="field">
          <label htmlFor="new-displayname">Görünen Ad</label>
          <input
            id="new-displayname"
            className="input"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            style={{ maxWidth: 200 }}
          />
        </div>
        <div className="field">
          <label>Tip</label>
          <RoleTypeSelect value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} />
        </div>
        <button type="submit" className="btn btn-primary">Ekle</button>
      </form>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '1.5rem' }}>Yükleniyor…</p>
        ) : users.length === 0 ? (
          <p style={{ padding: '1.5rem' }}>Henüz kullanıcı yok.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Görünen Ad</th>
                <th>Kullanıcı Adı</th>
                <th>Tip</th>
                <th style={{ width: 260 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
              {users.map((u) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.18 }}
                >
                  {editingId === u.id ? (
                    <>
                      <td>
                        <input
                          className="input"
                          value={editForm.displayName}
                          onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                          maxLength={DISPLAY_NAME_MAX_LENGTH}
                          style={{ maxWidth: 160 }}
                          autoFocus
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editForm.username}
                          onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                          maxLength={USERNAME_MAX_LENGTH}
                          style={{ maxWidth: 140 }}
                        />
                      </td>
                      <td>
                        <RoleTypeSelect
                          value={editForm.role}
                          onChange={(role) => setEditForm((f) => ({ ...f, role }))}
                        />
                      </td>
                      <td>
                        <div className="stack gap-xs">
                          <input
                            className="input"
                            type="password"
                            placeholder="Yeni şifre (opsiyonel)"
                            value={editForm.password}
                            onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                            style={{ fontSize: '0.78rem' }}
                          />
                          <div className="row gap-xs">
                            <button type="button" className="btn" onClick={() => saveEdit(u.id)}>
                              Kaydet
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                              Vazgeç
                            </button>
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{u.displayName}</td>
                      <td className="text-secondary">{u.username}</td>
                      <td><RoleTag role={u.role} /></td>
                      <td>
                        <div className="row gap-xs">
                          <button type="button" className="btn btn-ghost" onClick={() => startEdit(u)}>
                            Düzenle
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => setDeleteTarget(u)}>
                            Sil
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Kullanıcıyı sil"
        message={deleteTarget ? `"${deleteTarget.displayName}" (${deleteTarget.username}) kullanıcısını silmek istediğinize emin misiniz?` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
