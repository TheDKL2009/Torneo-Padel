import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Home from './pages/Home.jsx'
import Categorias from './pages/Categorias.jsx'
import Cuadros from './pages/Cuadros.jsx'
import Partidos from './pages/Partidos.jsx'
import Horarios from './pages/Horarios.jsx'
import Patrocinadores from './pages/Patrocinadores.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminCategorias from './pages/AdminCategorias.jsx'
import AdminParejas from './pages/AdminParejas.jsx'
import AdminPartidos from './pages/AdminPartidos.jsx'
import AdminPatrocinadores from './pages/AdminPatrocinadores.jsx'
import './styles/main.css'

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
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="categorias" element={<AdminCategorias />} />
              <Route path="parejas" element={<AdminParejas />} />
              <Route path="partidos" element={<AdminPartidos />} />
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
