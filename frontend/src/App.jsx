import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import CategoriesPage from './pages/admin/CategoriesPage';
import ProductsPage from './pages/admin/ProductsPage';
import TablesPage from './pages/admin/TablesPage';
import ReportsPage from './pages/admin/ReportsPage';
import UsersPage from './pages/admin/UsersPage';
import TableSelectPage from './pages/staff/TableSelectPage';
import OrderPage from './pages/staff/OrderPage';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/masalar'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="kategoriler" replace />} />
            <Route path="kategoriler" element={<CategoriesPage />} />
            <Route path="urunler" element={<ProductsPage />} />
            <Route path="masalar" element={<TablesPage />} />
            <Route path="kullanicilar" element={<UsersPage />} />
            <Route path="raporlar" element={<ReportsPage />} />
          </Route>

          <Route
            path="/masalar"
            element={
              <ProtectedRoute role={['admin', 'personel', 'mobile']}>
                <TableSelectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adisyon/:orderId"
            element={
              <ProtectedRoute role={['admin', 'personel', 'mobile']}>
                <OrderPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
