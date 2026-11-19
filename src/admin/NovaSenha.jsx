import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, linkRecuperacao } from '../lib/supabase'
import { useNoIndex } from './useSessaoAdmin'

// Lê ?token_hash=...&type=invite|recovery (link gerado no painel)
const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
const tokenHash = params.get('token_hash')
const tipoToken = ['invite', 'recovery'].includes(params.get('type')) ? params.get('type') : null

// Página aberta pelo link de acesso (WhatsApp) ou pelo e-mail de "esqueci a senha"
export default function NovaSenha() {
  useNoIndex()
  const navigate = useNavigate()
  const [pronto, setPronto] = useState(false)
  const [temSessao, setTemSessao] = useState(false)
  const [nova, setNova] = useState('')
  const [repetir, setRepetir] = useState('')
  const [msg, setMsg] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [linkGasto, setLinkGasto] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setTemSessao(Boolean(data.session))
      setPronto(true)
    })
  }, [])

  const viaToken = Boolean(tokenHash && tipoToken)
  const convite = viaToken ? tipoToken === 'invite' : linkRecuperacao.convite

  const salvar = async (e) => {
    e.preventDefault()
    setMsg('')
    if (nova.length < 6) return setMsg('Erro: a senha precisa ter pelo menos 6 caracteres.')
    if (nova !== repetir) return setMsg('Erro: as duas senhas não são iguais.')
    setSalvando(true)

    if (viaToken) {
      // Só aqui o link é "usado" — abrir a página não gasta o acesso
      const { error: errOtp } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipoToken })
      if (errOtp) {
        setSalvando(false)
        setLinkGasto(true)
        return
      }
    }

    const { error } = await supabase.auth.updateUser({ password: nova })
    setSalvando(false)
    if (error) return setMsg('Erro: ' + error.message)
    setMsg('Senha criada! Abrindo o painel…')
    setTimeout(() => navigate('/admin', { replace: true }), 1200)
  }

  if (!pronto) return <p className="status">Carregando…</p>

  const linkValido = viaToken || (linkRecuperacao.valido && temSessao)
  if (!linkValido || linkGasto)
    return (
      <main className="admin login">
        <h1>Link inválido</h1>
        <p className="erro">
          {linkGasto || linkRecuperacao.expirado
            ? 'Este link expirou ou já foi usado. Peça um novo ao responsável pela plataforma, ou use "Esqueci a senha".'
            : 'Abra esta página pelo link que você recebeu.'}
        </p>
        <Link to="/admin/login" className="btn">Ir para o login</Link>
      </main>
    )

  return (
    <main className="admin login">
      <h1>{convite ? 'Bem-vindo! Crie sua senha' : 'Criar nova senha'}</h1>
      <p className="email">Depois, entre sempre pela área do restaurante com seu e-mail e esta senha.</p>
      <form onSubmit={salvar} className="form card-form">
        <label>Nova senha (mínimo 6 caracteres)
          <input type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} required minLength={6} />
        </label>
        <label>Repita a nova senha
          <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={6} />
        </label>
        {msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
        <button className="btn primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Criar senha'}</button>
      </form>
    </main>
  )
}
