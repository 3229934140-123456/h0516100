import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DeviceList from './pages/DeviceList'
import DeviceDetail from './pages/DeviceDetail'
import AlertRules from './pages/AlertRules'
import Notifications from './pages/Notifications'
import DeviceGroups from './pages/DeviceGroups'
import AuditLogs from './pages/AuditLogs'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="devices" element={<DeviceList />} />
        <Route path="devices/:id" element={<DeviceDetail />} />
        <Route path="alerts" element={<AlertRules />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="groups" element={<DeviceGroups />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>
    </Routes>
  )
}

export default App
