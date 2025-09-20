import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.mock';
import { Layout } from './components/Layout/Layout';
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
          <Route path="/feed" element={<Layout><Feed /></Layout>} />
          <Route path="/drivers/:id" element={<Layout><DriverDetail /></Layout>} />
          <Route path="/teams/:id" element={<Layout><TeamDetail /></Layout>} />
          <Route path="/tracks/:id" element={<Layout><TrackDetail /></Layout>} />
          <Route path="/polls" element={<Layout><Polls /></Layout>} />
          <Route path="/profile/:handle" element={<Layout><Profile /></Layout>} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
