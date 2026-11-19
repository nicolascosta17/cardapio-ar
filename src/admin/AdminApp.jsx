import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Painel from './Painel'
import Lojas from './Lojas'
import TrocarSenha from './TrocarSenha'
import MeuUsuario from './MeuUsuario'

const CHAVE_LOJA = 'admin-loja-atual'

export default function AdminApp({ usuario, superAdmin, lojas, recarregarLojas }) {
  const [aba, setAba] = useState(superAdmin && lojas.length === 0 ? 'lojas' : 'cardapio')
  const [lojaId, setLojaId] = useState(() => {
    try { return localStorage.getItem(CHAVE_LOJA) } catch { return null }
  })
  const [trocandoSenha, setTrocandoSenha] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState(false)

  const loja = lojas.find((l) => l.id === lojaId) || lojas[0]
  useEffect(() => {
    if (loja) try { localStorage.setItem(CHAVE_LOJA, loja.id) } catch { /* ignora */ }
  }, [loja])

  const abrirCardapio = (id) => { setLojaId(id); setAba('cardapio'); window.scrollTo({ top: 0 }) }

  return (
    <main className="admin">
      <header className="admin-topo">
        <h1>{superAdmin ? 'Painel da plataforma' : 'Painel do cardápio'}</h1>
        <div>
          <span className="email">{usuario.email}</span>
          {loja && <a className="btn" href={`/${loja.slug}`} target="_blank" rel="noreferrer">Ver cardápio</a>}
          <button className="btn" onClick={() => setEditandoUsuario((v) => !v)}>Meu usuário</button>
          <button className="btn" onClick={() => setTrocandoSenha((v) => !v)}>Trocar senha</button>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </header>

      {editandoUsuario && <MeuUsuario userId={usuario.id} onFechar={() => setEditandoUsuario(false)} />}
      {trocandoSenha && <TrocarSenha email={usuario.email} onFechar={() => setTrocandoSenha(false)} />}

      {superAdmin && (
        <nav className="abas">
          <button className={aba === 'lojas' ? 'ativo' : ''} onClick={() => setAba('lojas')}>Lojas ({lojas.length})</button>
          <button className={aba === 'cardapio' ? 'ativo' : ''} onClick={() => setAba('cardapio')} disabled={!loja}>Cardápio</button>
        </nav>
      )}

      {aba === 'lojas' && superAdmin ? (
        <Lojas lojas={lojas} recarregar={recarregarLojas} onAbrirCardapio={abrirCardapio} />
      ) : loja ? (
        <>
          {lojas.length > 1 ? (
            <label className="seletor-loja">
              Loja
              <select value={loja.id} onChange={(e) => setLojaId(e.target.value)}>
                {lojas.map((l) => <option key={l.id} value={l.id}>{l.nome}{l.ativo ? '' : ' (desativada)'}</option>)}
              </select>
            </label>
          ) : (
            <p className="loja-atual">Loja: <strong>{loja.nome}</strong></p>
          )}
          <Painel loja={loja} />
        </>
      ) : (
        <p className="status">Nenhuma loja ainda. Cadastre a primeira na aba Lojas.</p>
      )}
    </main>
  )
}
