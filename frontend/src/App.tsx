import { Routes, Route, Navigate } from 'react-router-dom';
import { Protected } from './components/Protected';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Maintenance from './pages/Maintenance';
import TaskDetail from './pages/TaskDetail';
import Drills from './pages/Drills';
import DrillDetail from './pages/DrillDetail';
import Ships from './pages/Ships';
import Crew from './pages/Crew';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="maintenance/:id" element={<TaskDetail />} />
        <Route path="drills" element={<Drills />} />
        <Route path="drills/:id" element={<DrillDetail />} />
        <Route path="ships" element={<Protected roles={['admin']}><Ships /></Protected>} />
        <Route path="crew" element={<Protected roles={['admin']}><Crew /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
