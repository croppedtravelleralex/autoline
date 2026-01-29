
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SystemStateProvider } from './context/SystemStateContext';
import { UserProvider } from './context/UserContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { RunLogs } from './pages/RunLogs';
import { OperationLogs } from './pages/OperationLogs';
import { Alerts } from './pages/Alerts';
import { Statistics } from './pages/Statistics';
import { LineDetail } from './pages/LineDetail';
import { LineView } from './pages/LineView';
import { LineEditor } from './pages/LineEditor';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { Help } from './pages/Help';
import { Inspection } from './pages/Inspection';

import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalErrorListener } from './components/GlobalErrorListener';

function App() {
  console.log('🔧 App component rendered');
  return (
    <ErrorBoundary>
      <ToastProvider>
        <GlobalErrorListener />
        <UserProvider>
          <SettingsProvider>
            <SystemStateProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Home />} />
                    <Route path="logs" element={<RunLogs />} />
                    <Route path="operations" element={<OperationLogs />} />
                    <Route path="alerts" element={<Alerts />} />
                    <Route path="stats" element={<Statistics />} />
                    <Route path="line-editor" element={<LineEditor />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="help" element={<Help />} />
                    <Route path="inspection" element={<Inspection />} />
                  </Route>
                  {/* Separate routes for detail/view also need protection? Yes, but they are outside MainLayout based on current structure. Let's wrap them or verify if they should be separate. User asked "Login every time software opens". Assuming detail view also requires login. */}
                  <Route path="/lines/:id" element={
                    <ProtectedRoute>
                      <LineDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/lines/:id/view" element={
                    <ProtectedRoute>
                      <LineView />
                    </ProtectedRoute>
                  } />
                </Routes>
              </BrowserRouter>
            </SystemStateProvider>
          </SettingsProvider>
        </UserProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
