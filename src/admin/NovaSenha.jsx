import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, linkRecuperacao } from '../lib/supabase'
import { useNoIndex } from './useSessaoAdmin'

// Página aberta pelo link do e-mail de "esqueci a senha"
export default function NovaSenha() {
  useNoIndex()
  const navigate = useNavigate()
  const [pronto, setPronto] = useState(false)
  const [temSessao, setTemSessao] = useState(false)
  const [nova, setNova] = useState('')
  const [repetir, setRepetir] = useState('')
  const [msg, setMsg] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setTemSessao(Boolean(data.session))
      setPronto(true)
    })
  }, [])

  const salvar = async (e) => {
    e.preventDefault()
    setMsg('')
    if (nova.length < 8) return setMsg('Erro: a senha precisa ter pelo menos 8 caracteres.')
    if (nova !== repetir) return setMsg('Erro: as duas senhas não são iguais.')
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: nova })
    setSalvando(false)
    if (error) return setMsg('Erro: ' + error.message)
    setMsg('Senha criada! Abrindo o painel…')
    setTimeout(() => navigate('/admin', { replace: true }), 1200)
  }

  if (!pronto) return <p className="status">Carregando…</p>

  // Só aceita quem chegou agora pelo link do e-mail
  if (!linkRecuperacao.valido || !temSessao)
    return (
      <main className="admin login">
        <h1>Link inválido</h1>
        <p className="erro">
          {linkRecuperacao.expirado
            ? 'Este link expirou ou já foi usado.'
            : 'Abra esta página pelo link enviado ao seu e-mail.'}
        </p>
        <Link to="/admin/login" className="btn">Pedir um novo link</Link>
      </main>
    )

  return (
    <main className="admin login">
      <h1>Criar nova senha</h1>
      <form onSubmit={salvar} className="form card-form">
        <label>Nova senha (mínimo 8 caracteres)
          <input type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} required minLength={8} />
        </label>
        <label>Repita a nova senha
          <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={8} />
        </label>
        {msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
        <button className="btn primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar senha'}</button>
      </form>
    </main>
  )
}
