
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.mock';
import { AdminLayout } from './components/AdminLayout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Highlights } from './pages/Highlights';
import { Discussions } from './pages/Discussions';
import { Spotlight } from './pages/Spotlight';
import { Polls } from './pages/Polls';
import { Entities } from './pages/Entities';
import { Users } from './pages/Users';
import { Races } from './pages/Races';
import { Settings } from './pages/Settings';
import { AuditLog } from './pages/AuditLog';
import styles from './App.module.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/highlights" element={<Highlights />} />
                <Route path="/discussions" element={<Discussions />} />
                <Route path="/spotlight" element={<Spotlight />} />
                <Route path="/polls" element={<Polls />} />
                <Route path="/entities" element={<Entities />} />
                <Route path="/users" element={<Users />} />
                <Route path="/races" element={<Races />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/audit-log" element={<AuditLog />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className={styles.app}>
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}

export default App;
