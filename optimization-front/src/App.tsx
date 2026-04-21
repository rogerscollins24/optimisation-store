/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserProvider } from './store';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/Toast';
import GlobalBackground from './components/GlobalBackground';
import Layout from './components/Layout';
import Home from './pages/Home';
import Starting from './pages/Starting';
import Records from './pages/Records';
import Profile from './pages/Profile';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Login from './pages/Login';
import Support from './pages/Support';
import PersonalInformation from './pages/PersonalInformation.tsx';
import WalletBinding from './pages/WalletBinding.tsx';
import Notifications from './pages/Notifications.tsx';
import Faqs from './pages/Faqs';

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
    <ThemeProvider>
    <ToastProvider>
    <LanguageProvider>
      <AuthProvider>
        <UserProvider>
          <div className="app-shell">
            <GlobalBackground />
            <div className="app-shell__content">
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
                    <Route path="profile/personal" element={<PersonalInformation />} />
                    <Route path="profile/wallet" element={<WalletBinding />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="faqs" element={<Faqs />} />
                    <Route path="deposit" element={<Deposit />} />
                    <Route path="withdraw" element={<Withdraw />} />
                    <Route path="support" element={<Support />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </div>
          </div>
        </UserProvider>
      </AuthProvider>
    </LanguageProvider>
    <ToastContainer />
    </ToastProvider>
    </ThemeProvider>
  );
}
