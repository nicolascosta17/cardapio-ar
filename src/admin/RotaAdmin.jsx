import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSessaoAdmin, useNoIndex } from './useSessaoAdmin'

// Só renderiza o conteúdo para administradores logados.
// Atenção: isto é só a "porta da frente". Quem realmente protege os dados
// são as regras RLS do Supabase — mesmo burlando o front, ninguém grava nada.
export default function RotaAdmin({ children }) {
  useNoIndex()
  const { estado, usuario } = useSessaoAdmin()

  if (estado === 'carregando') return <p className="status">Verificando acesso…</p>
  if (estado === 'deslogado') return <Navigate to="/admin/login" replace />
  if (estado === 'negado')
    return (
      <main className="admin login">
        <h1>Acesso negado</h1>
        <p className="erro">O usuário {usuario?.email} não tem permissão de administrador.</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
      </main>
    )
  return children(usuario)
}
