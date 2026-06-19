import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Rooms from '@/pages/Rooms'
import Reservations from '@/pages/Reservations'
import NewReservation from '@/pages/NewReservation'
import CheckIn from '@/pages/CheckIn'
import Services from '@/pages/Services'
import Housekeeping from '@/pages/Housekeeping'
import Members from '@/pages/Members'
import GMDashboard from '@/pages/GMDashboard'
import Reports from '@/pages/Reports'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="reservations/new" element={<NewReservation />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="services" element={<Services />} />
          <Route path="housekeeping" element={<Housekeeping />} />
          <Route path="members" element={<Members />} />
          <Route path="gm-dashboard" element={<GMDashboard />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  )
}
