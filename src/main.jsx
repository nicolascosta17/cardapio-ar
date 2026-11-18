import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import '@google/model-viewer'
import Cardapio from './pages/Cardapio.jsx'
import './styles.css'

// O código do admin é carregado à parte: o cliente do cardápio nunca baixa essa parte
const AdminLogin = lazy(() => import('./admin/AdminLogin.jsx'))
const RotaAdmin = lazy(() => import('./admin/RotaAdmin.jsx'))
const Painel = lazy(() => import('./admin/Painel.jsx'))
const NovaSenha = lazy(() => import('./admin/NovaSenha.jsx'))

const carregando = <p className="status">Carregando…</p>

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={carregando}>
        <Routes>
          <Route path="/" element={<Cardapio />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/nova-senha" element={<NovaSenha />} />
          <Route
            path="/admin"
            element={<RotaAdmin>{(usuario) => <Painel email={usuario.email} />}</RotaAdmin>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
)
