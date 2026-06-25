import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import Toast from './components/Toast.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Home from './pages/Home.jsx'
import Categorias from './pages/Categorias.jsx'
import Cuadros from './pages/Cuadros.jsx'
import Partidos from './pages/Partidos.jsx'
import Horarios from './pages/Horarios.jsx'
import Patrocinadores from './pages/Patrocinadores.jsx'
// import Inscripcion from './pages/Inscripcion.jsx' // Inscripciones deshabilitadas temporalmente
import Login from './pages/Login.jsx'
import './styles/main.css'

const AdminDashboard      = lazy(() => import('./pages/AdminDashboard.jsx'))
const AdminCategorias     = lazy(() => import('./pages/AdminCategorias.jsx'))
const AdminParejas        = lazy(() => import('./pages/AdminParejas.jsx'))
const AdminPartidos       = lazy(() => import('./pages/AdminPartidos.jsx'))
const AdminGrupos         = lazy(() => import('./pages/AdminGrupos.jsx'))
const AdminPistas         = lazy(() => import('./pages/AdminPistas.jsx'))
const AdminPatrocinadores = lazy(() => import('./pages/AdminPatrocinadores.jsx'))

function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/cuadros" element={<Cuadros />} />
          <Route path="/partidos" element={<Partidos />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/patrocinadores" element={<Patrocinadores />} />
          {/* <Route path="/inscripcion" element={<Inscripcion />} /> Inscripciones deshabilitadas temporalmente */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<Login />} />

          <Route element={<Suspense fallback={<p className="info-state">Cargando panel...</p>}><ProtectedRoute /></Suspense>}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
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
      <Toast />
    </div>
  )
}

export default App
