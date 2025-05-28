import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UniAuth from './pages/UniAuth';
import Home from './pages/Home';
import Logout from './pages/Logout';
import { AuthProvider, useAuth } from './context/AuthContext';
import SessionTimeout from './pages/SessionTimeout';

const ProtectedRoute = ({ children, allowUnauthenticated = false }) => {
  const token = localStorage.getItem('access_token');
  const location = useLocation();

  // If token exists and trying to access /auth, redirect to /home
  if (token && location.pathname === '/auth') {
    return <Navigate to="/home" replace />;
  }

  // If no token and trying to access a protected route (not /auth or /logout), redirect to /auth
  if (!token && location.pathname !== '/auth' && location.pathname !== '/logout' && !allowUnauthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <SessionTimeout />}
      <Routes>
        <Route
          path="/auth"
          element={
            <ProtectedRoute>
              <UniAuth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logout"
          element={
            <ProtectedRoute allowUnauthenticated={true}>
              <Logout />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;