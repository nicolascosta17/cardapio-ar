import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, enviarArquivo, formatarPreco, validarArquivo } from '../lib/supabase'
import TrocarSenha from './TrocarSenha'

const VAZIO = { nome: '', descricao: '', preco: '', categoria: 'Pratos', ordem: 0, ativo: true }

export default function Painel({ email }) {
  const [pratos, setPratos] = useState([])
  const [form, setForm] = useState(VAZIO)
  const [editando, setEditando] = useState(null)
  const [arquivos, setArquivos] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [trocandoSenha, setTrocandoSenha] = useState(false)

  const carregar = async () => {
    const { data } = await supabase.from('pratos').select('*').order('categoria').order('ordem')
    setPratos(data || [])
  }
  useEffect(() => { carregar() }, [])

  const campo = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const arquivo = (k) => (e) => {
    const f = e.target.files[0]
    const problema = f && validarArquivo(f, k)
    if (problema) { setMsg('Erro: ' + problema); e.target.value = ''; return }
    setMsg('')
    setArquivos({ ...arquivos, [k]: f })
  }

  const editar = (p) => {
    setEditando(p)
    setForm({ nome: p.nome, descricao: p.descricao || '', preco: p.preco, categoria: p.categoria, ordem: p.ordem, ativo: p.ativo })
    setArquivos({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const limpar = () => { setEditando(null); setForm(VAZIO); setArquivos({}); }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    try {
      const dados = { ...form, preco: Number(String(form.preco).replace(',', '.')) || 0, ordem: Number(form.ordem) || 0 }
      if (arquivos.imagem) dados.imagem_url = await enviarArquivo(arquivos.imagem, 'imagens')
      if (arquivos.glb) dados.modelo_glb_url = await enviarArquivo(arquivos.glb, 'modelos')
      if (arquivos.usdz) dados.modelo_usdz_url = await enviarArquivo(arquivos.usdz, 'modelos')
      const { error } = editando
        ? await supabase.from('pratos').update(dados).eq('id', editando.id)
        : await supabase.from('pratos').insert(dados)
      if (error) throw error
      setMsg(editando ? 'Prato atualizado!' : 'Prato cadastrado!')
      limpar()
      e.target.reset()
      carregar()
    } catch (err) {
      setMsg('Erro: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  const apagar = async (p) => {
    if (!window.confirm(`Apagar "${p.nome}"?`)) return
    await supabase.from('pratos').delete().eq('id', p.id)
    carregar()
  }

  return (
    <main className="admin">
      <header className="admin-topo">
        <h1>Painel do cardápio</h1>
        <div>
          <span className="email">{email}</span>
          <Link to="/" className="btn">Ver cardápio</Link>
          <button className="btn" onClick={() => setTrocandoSenha((v) => !v)}>Trocar senha</button>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </header>

      {trocandoSenha && <TrocarSenha email={email} onFechar={() => setTrocandoSenha(false)} />}

      <form onSubmit={salvar} className="form card-form">
        <h2>{editando ? `Editando: ${editando.nome}` : 'Novo prato'}</h2>
        <label>Nome<input value={form.nome} onChange={campo('nome')} required /></label>
        <label>Descrição<textarea rows={2} value={form.descricao} onChange={campo('descricao')} /></label>
        <div className="linha">
          <label>Preço (R$)<input inputMode="decimal" placeholder="0,00" value={form.preco} onChange={campo('preco')} required /></label>
          <label>Categoria<input value={form.categoria} onChange={campo('categoria')} list="cats" required /></label>
          <label>Ordem<input type="number" inputMode="numeric" value={form.ordem} onChange={campo('ordem')} /></label>
        </div>
        <datalist id="cats">
          {[...new Set(pratos.map((p) => p.categoria))].map((c) => <option key={c} value={c} />)}
        </datalist>
        <label>Foto do prato<input type="file" accept="image/*" onChange={arquivo('imagem')} /></label>
        <label>Modelo 3D (.glb) — Android e navegador<input type="file" accept=".glb" onChange={arquivo('glb')} /></label>
        <label>Modelo 3D (.usdz) — iPhone (opcional)<input type="file" accept=".usdz" onChange={arquivo('usdz')} /></label>
        <label className="check"><input type="checkbox" checked={form.ativo} onChange={campo('ativo')} /> Aparece no cardápio</label>
        {msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
        <div className="linha">
          <button className="btn primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          {editando && <button type="button" className="btn" onClick={limpar}>Cancelar</button>}
        </div>
      </form>

      <table className="tabela">
        <thead><tr><th>Prato</th><th>Categoria</th><th>Preço</th><th>3D</th><th></th></tr></thead>
        <tbody>
          {pratos.map((p) => (
            <tr key={p.id} className={p.ativo ? '' : 'inativo'}>
              <td data-label="Prato" className="nome">{p.nome}</td>
              <td data-label="Categoria">{p.categoria}</td>
              <td data-label="Preço">{formatarPreco(p.preco)}</td>
              <td data-label="3D">{p.modelo_glb_url ? '✓' : '—'}{p.modelo_usdz_url ? ' 🍎' : ''}{p.ativo ? '' : ' · oculto'}</td>
              <td className="acoes">
                <button className="btn" onClick={() => editar(p)}>Editar</button>
                <button className="btn perigo" onClick={() => apagar(p)}>Apagar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
