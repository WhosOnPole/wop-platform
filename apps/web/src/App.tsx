import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ComingSoon } from './pages/ComingSoon';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ResetPassword } from './pages/ResetPassword';
import { Feed } from './pages/Feed';
import { DriverDetail } from './pages/DriverDetail';
import { TeamDetail } from './pages/TeamDetail';
import { TrackDetail } from './pages/TrackDetail';
import { Polls } from './pages/Polls';
import { Profile } from './pages/Profile';
import styles from './App.module.css';

function App() {
  return (
    <AuthProvider>
      <div className={styles.app}>
        <Routes>
          <Route path="/" element={<ComingSoon />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/feed" element={
            <ProtectedRoute>
              <Layout><Feed /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/drivers/:id" element={
            <ProtectedRoute>
              <Layout><DriverDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teams/:id" element={
            <ProtectedRoute>
              <Layout><TeamDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/tracks/:id" element={
            <ProtectedRoute>
              <Layout><TrackDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/polls" element={
            <ProtectedRoute>
              <Layout><Polls /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile/:handle" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
