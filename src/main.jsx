import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@google/model-viewer'
import Cardapio from './pages/Cardapio.jsx'
import Inicio from './pages/Inicio.jsx'
import './styles.css'

// O código do admin é carregado à parte: o cliente do cardápio nunca baixa essa parte
const AdminLogin = lazy(() => import('./admin/AdminLogin.jsx'))
const RotaAdmin = lazy(() => import('./admin/RotaAdmin.jsx'))
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))
const NovaSenha = lazy(() => import('./admin/NovaSenha.jsx'))

const carregando = <p className="status">Carregando…</p>

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={carregando}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/nova-senha" element={<NovaSenha />} />
          <Route path="/admin" element={<RotaAdmin>{(sessao) => <AdminApp {...sessao} />}</RotaAdmin>} />
          <Route path="/:slug" element={<Cardapio />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
)
