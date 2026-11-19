import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSessaoAdmin, useNoIndex } from './useSessaoAdmin'

// Só renderiza o conteúdo para quem pode gerenciar alguma loja.
// Atenção: isto é só a "porta da frente". Quem realmente protege os dados
// são as regras RLS do Supabase — mesmo burlando o front, ninguém grava nada.
export default function RotaAdmin({ children }) {
  useNoIndex()
  const sessao = useSessaoAdmin()

  if (sessao.estado === 'carregando') return <p className="status">Verificando acesso…</p>
  if (sessao.estado === 'erro')
    return (
      <main className="admin login">
        <h1>Sem conexão</h1>
        <p className="erro">Não foi possível falar com o servidor. Confira a internet e tente de novo.</p>
        <button className="btn primario" onClick={() => window.location.reload()}>Tentar de novo</button>
      </main>
    )
  if (sessao.estado === 'deslogado') return <Navigate to="/admin/login" replace />
  if (sessao.estado === 'negado')
    return (
      <main className="admin login">
        <h1>Acesso negado</h1>
        <p className="erro">O usuário {sessao.usuario?.email} não está vinculado a nenhuma loja.</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
      </main>
    )
  return children(sessao)
}
