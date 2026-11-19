import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const USERNAME_OK = /^[a-z0-9_]{3,20}$/

// Deixa a pessoa escolher/trocar seu próprio nome de usuário,
// usado para entrar no painel no lugar do e-mail.
export default function MeuUsuario({ userId, onFechar }) {
  const [atual, setAtual] = useState(null)
  const [username, setUsername] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase.from('perfis').select('username').eq('user_id', userId).maybeSingle().then(({ data }) => {
      setAtual(data?.username || null)
      setUsername(data?.username || '')
      setCarregando(false)
    })
  }, [userId])

  const salvar = async (e) => {
    e.preventDefault()
    setMsg('')
    const nome = username.trim().toLowerCase()
    if (!USERNAME_OK.test(nome)) {
      return setMsg('Erro: use só letras minúsculas, números e _ (3 a 20 caracteres).')
    }
    setSalvando(true)
    const { error } = await supabase.from('perfis').upsert({ user_id: userId, username: nome }, { onConflict: 'user_id' })
    setSalvando(false)
    if (error) {
      if (error.code === '23505') return setMsg('Erro: esse nome de usuário já está em uso.')
      return setMsg('Erro: ' + error.message)
    }
    setAtual(nome)
    setMsg('Nome de usuário salvo! Você já pode entrar com ele.')
  }

  return (
    <form onSubmit={salvar} className="form card-form">
      <h2>Meu usuário</h2>
      {carregando ? (
        <p className="status">Carregando…</p>
      ) : (
        <>
          <p className="email">{atual ? <>Nome atual: <strong>{atual}</strong></> : 'Você ainda não tem um nome de usuário.'}</p>
          <label>Novo nome de usuário
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="ex: joaorestaurante"
              minLength={3}
              maxLength={20}
              required
            />
          </label>
          {msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
          <div className="linha">
            <button className="btn primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" className="btn" onClick={onFechar}>Fechar</button>
          </div>
        </>
      )}
    </form>
  )
}
