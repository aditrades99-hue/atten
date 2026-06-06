import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useStore from './store/useStore';

// Device Security Gate
import DeviceGate from './components/DeviceGate';

// Kiosk Pages
import KioskHome from './pages/kiosk/KioskHome';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import StaffList from './pages/admin/StaffList';
import Attendance from './pages/admin/Attendance';
import MonthlyReport from './pages/admin/MonthlyReport';
import Settings from './pages/admin/Settings';

// Admin Layout with Sidebar
import AdminLayout from './components/AdminLayout';

// Protected Route Wrapper for Admin Pages
const ProtectedAdminRoute = () => {
  const admin = useStore((state) => state.admin);
  const token = useStore((state) => state.token);
  
  if (!admin || !token || admin.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

// Protected Route Wrapper for Kiosk Pages
const ProtectedKioskRoute = () => {
  const admin = useStore((state) => state.admin);
  const token = useStore((state) => state.token);
  
  // Both admin and kiosk roles can view the kiosk page
  if (!admin || !token) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <Outlet />;
};

function App() {
  const admin = useStore((state) => state.admin);

  return (
    <DeviceGate>
      <BrowserRouter>
        <Routes>
          {/* Redirect root based on role */}
          <Route path="/" element={
            admin?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : 
            admin?.role === 'kiosk' ? <Navigate to="/kiosk" replace /> :
            <Navigate to="/admin/login" replace />
          } />
          
          {/* Kiosk Routes */}
          <Route path="/kiosk" element={<ProtectedKioskRoute />}>
            <Route index element={<KioskHome />} />
          </Route>
          
          {/* Login Route */}
          <Route path="/admin/login" element={
            admin?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : 
            admin?.role === 'kiosk' ? <Navigate to="/kiosk" replace /> :
            <AdminLogin />
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedAdminRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="staff" element={<StaffList />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="monthly-report" element={<MonthlyReport />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DeviceGate>
  );
}

export default App;
