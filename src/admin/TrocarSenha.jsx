import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Troca a senha do admin logado. Pede a senha atual antes,
// para que ninguém troque a senha só por pegar o celular desbloqueado.
export default function TrocarSenha({ email, onFechar }) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [repetir, setRepetir] = useState('')
  const [msg, setMsg] = useState('')
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e) => {
    e.preventDefault()
    setMsg('')
    if (nova.length < 6) return setMsg('Erro: a nova senha precisa ter pelo menos 6 caracteres.')
    if (nova !== repetir) return setMsg('Erro: as duas senhas novas não são iguais.')
    if (nova === atual) return setMsg('Erro: a nova senha é igual à atual.')

    setSalvando(true)
    // Confere a senha atual
    const { error: errAtual } = await supabase.auth.signInWithPassword({ email, password: atual })
    if (errAtual) {
      setSalvando(false)
      return setMsg('Erro: senha atual incorreta.')
    }
    const { error } = await supabase.auth.updateUser({ password: nova })
    setSalvando(false)
    if (error) return setMsg('Erro: ' + error.message)
    setAtual(''); setNova(''); setRepetir('')
    setMsg('Senha alterada! Use a nova senha no próximo login.')
  }

  return (
    <form onSubmit={salvar} className="form card-form">
      <h2>Trocar senha</h2>
      <label>Senha atual
        <input type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} required />
      </label>
      <label>Nova senha (mínimo 6 caracteres)
        <input type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} required minLength={6} />
      </label>
      <label>Repita a nova senha
        <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={6} />
      </label>
      {msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
      <div className="linha">
        <button className="btn primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar nova senha'}</button>
        <button type="button" className="btn" onClick={onFechar}>Fechar</button>
      </div>
    </form>
  )
}
