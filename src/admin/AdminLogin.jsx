import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSessaoAdmin, useNoIndex } from './useSessaoAdmin'

const MAX_TENTATIVAS = 5
const BLOQUEIO_MS = 5 * 60 * 1000
const CHAVE = 'admin-login-bloqueio'

const lerBloqueio = () => {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || { falhas: 0, ate: 0 } }
  catch { return { falhas: 0, ate: 0 } }
}
const salvarBloqueio = (b) => { try { localStorage.setItem(CHAVE, JSON.stringify(b)) } catch { /* ignora */ } }

export default function AdminLogin() {
  useNoIndex()
  const { estado } = useSessaoAdmin()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [bloqueio, setBloqueio] = useState(lerBloqueio)
  const [agora, setAgora] = useState(Date.now())

  const bloqueado = bloqueio.ate > agora
  useEffect(() => {
    if (!bloqueado) return
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [bloqueado])

  if (estado === 'admin') return <Navigate to="/admin" replace />

  const entrar = async (e) => {
    e.preventDefault()
    if (bloqueado) return
    setErro('')
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) {
      const falhas = bloqueio.falhas + 1
      const novo = falhas >= MAX_TENTATIVAS ? { falhas: 0, ate: Date.now() + BLOQUEIO_MS } : { falhas, ate: 0 }
      setBloqueio(novo); salvarBloqueio(novo); setAgora(Date.now())
      setSenha('')
      // Mensagem genérica: não revela se o e-mail existe
      setErro(novo.ate ? 'Muitas tentativas. Aguarde alguns minutos.' : 'E-mail ou senha inválidos.')
      return
    }
    salvarBloqueio({ falhas: 0, ate: 0 })
  }

  const restante = Math.ceil((bloqueio.ate - agora) / 1000)

  return (
    <main className="admin login">
      <h1>Área do administrador</h1>
      <p className="email">Acesso restrito. Entre com o usuário cadastrado pelo responsável.</p>
      <form onSubmit={entrar} className="form card-form">
        <label>E-mail
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Senha
          <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button className="btn primario" disabled={enviando || bloqueado}>
          {bloqueado ? `Bloqueado (${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')})` : enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <Link to="/">← Voltar ao cardápio</Link>
    </main>
  )
}
