import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './api/queries.js';
import { CardDetailPage } from './pages/CardDetailPage.js';
import { CardListPage } from './pages/CardListPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { applyTelegramTheme, callReady } from './telegram/webapp.js';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (session.isLoading) {
    return <div className="p-6 text-sm text-[var(--tg-hint-color,#999)]">Loading…</div>;
  }
  if (!session.data || session.data.authenticated === false) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (session.isLoading) return null;
  if (session.data?.authenticated === true) return <Navigate to="/cards" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  useEffect(() => {
    applyTelegramTheme();
    callReady();
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/cards" replace />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/cards"
        element={
          <RequireAuth>
            <CardListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/cards/:cardId"
        element={
          <RequireAuth>
            <CardDetailPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/cards" replace />} />
    </Routes>
  );
}
