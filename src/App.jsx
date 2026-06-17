import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Home from './pages/Home.jsx'
import Torneos from './pages/Torneos.jsx'
import TorneoDetalle from './pages/TorneoDetalle.jsx'
import Categorias from './pages/Categorias.jsx'
import Grupos from './pages/Grupos.jsx'
import Cuadros from './pages/Cuadros.jsx'
import Partidos from './pages/Partidos.jsx'
import Horarios from './pages/Horarios.jsx'
import Patrocinadores from './pages/Patrocinadores.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminTorneos from './pages/AdminTorneos.jsx'
import AdminTorneoDetalle from './pages/AdminTorneoDetalle.jsx'
import AdminCategorias from './pages/AdminCategorias.jsx'
import AdminParejas from './pages/AdminParejas.jsx'
import AdminPartidos from './pages/AdminPartidos.jsx'
import AdminGrupos from './pages/AdminGrupos.jsx'
import AdminPistas from './pages/AdminPistas.jsx'
import AdminPatrocinadores from './pages/AdminPatrocinadores.jsx'
import './styles/main.css'

function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/torneos" element={<Torneos />} />
          <Route path="/torneos/:torneoId" element={<TorneoDetalle />} />
          <Route path="/torneos/:torneoId/categorias" element={<Categorias />} />
          <Route path="/torneos/:torneoId/grupos" element={<Grupos />} />
          <Route path="/torneos/:torneoId/cuadros" element={<Cuadros />} />
          <Route path="/torneos/:torneoId/partidos" element={<Partidos />} />
          <Route path="/torneos/:torneoId/horarios" element={<Horarios />} />
          <Route path="/torneos/:torneoId/patrocinadores" element={<Patrocinadores />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/grupos" element={<Grupos />} />
          <Route path="/cuadros" element={<Cuadros />} />
          <Route path="/partidos" element={<Partidos />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/patrocinadores" element={<Patrocinadores />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<Login />} />

          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="torneos" element={<AdminTorneos />} />
              <Route path="torneos/nuevo" element={<AdminTorneos />} />
              <Route path="torneos/:torneoId" element={<AdminTorneoDetalle />} />
              <Route path="torneos/:torneoId/categorias" element={<AdminCategorias />} />
              <Route path="torneos/:torneoId/parejas" element={<AdminParejas />} />
              <Route path="torneos/:torneoId/grupos" element={<AdminGrupos />} />
              <Route path="torneos/:torneoId/partidos" element={<AdminPartidos />} />
              <Route path="torneos/:torneoId/patrocinadores" element={<AdminPatrocinadores />} />
              <Route path="categorias" element={<AdminCategorias />} />
              <Route path="parejas" element={<AdminParejas />} />
              <Route path="grupos" element={<AdminGrupos />} />
              <Route path="partidos" element={<AdminPartidos />} />
              <Route path="pistas" element={<AdminPistas />} />
              <Route path="patrocinadores" element={<AdminPatrocinadores />} />
            </Route>
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
