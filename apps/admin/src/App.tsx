import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { ClientsList } from './pages/ClientsList';
import { ClientDetail } from './pages/ClientDetail';
import { NewClientWizard } from './pages/NewClientWizard';
import { SupplyDetail } from './pages/SupplyDetail';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/clients" replace />} />
                <Route path="/clients" element={<ClientsList />} />
                <Route path="/clients/new" element={<NewClientWizard />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/supplies/:id" element={<SupplyDetail />} />
                <Route path="*" element={<Navigate to="/clients" replace />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  );
}
