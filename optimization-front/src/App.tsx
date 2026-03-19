/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserProvider } from './store';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Starting from './pages/Starting';
import Records from './pages/Records';
import Profile from './pages/Profile';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Login from './pages/Login';

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Home />} />
              <Route path="starting" element={<Starting />} />
              <Route path="records" element={<Records />} />
              <Route path="profile" element={<Profile />} />
              <Route path="deposit" element={<Deposit />} />
              <Route path="withdraw" element={<Withdraw />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  );
}
