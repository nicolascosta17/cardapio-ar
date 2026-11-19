import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, formatarPreco } from '../lib/supabase'
import Visualizador3D from '../components/Visualizador3D'

export default function Cardapio() {
  const { slug } = useParams()
  const [loja, setLoja] = useState(null)
  const [pratos, setPratos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    let ativo = true
    setCarregando(true); setErro(''); setLoja(null); setPratos([])
    ;(async () => {
      const buscarLoja = () => supabase.from('lojas').select('id, nome, slug').eq('slug', slug).eq('ativo', true).maybeSingle()
      let { data: l, error: e1 } = await buscarLoja()
      if (e1) ({ data: l, error: e1 } = await buscarLoja()) // tenta de novo uma vez
      if (!ativo) return
      if (e1) { setErro('Não foi possível carregar o cardápio.'); setCarregando(false); return }
      if (!l) { setErro('nao-encontrada'); setCarregando(false); return }
      setLoja(l)
      document.title = `${l.nome} · Cardápio 3D`
      const { data, error } = await supabase.from('pratos').select('*')
        .eq('loja_id', l.id).eq('ativo', true).order('categoria').order('ordem')
      if (!ativo) return
      if (error) setErro('Não foi possível carregar o cardápio.')
      else setPratos(data)
      setCarregando(false)
    })()
    return () => { ativo = false }
  }, [slug])

  const categorias = useMemo(
    () => ['Todos', ...new Set(pratos.map((p) => p.categoria))],
    [pratos]
  )
  const visiveis = categoria === 'Todos' ? pratos : pratos.filter((p) => p.categoria === categoria)

  return (
    <main className="cardapio">
      <header className="hero">
        <p className="sobre">Cardápio em realidade aumentada</p>
        <h1>{loja?.nome || ' '}</h1>
        <p>Toque em um prato com <span className="tag3d">3D</span> para vê-lo de todos os ângulos — e em cima da sua mesa.</p>
      </header>

      {categorias.length > 2 && (
        <nav className="filtros">
          {categorias.map((c) => (
            <button key={c} className={c === categoria ? 'ativo' : ''} onClick={() => setCategoria(c)}>
              {c}
            </button>
          ))}
        </nav>
      )}

      {carregando && <p className="status">Carregando…</p>}
      {erro === 'nao-encontrada' ? (
        <p className="status">Cardápio não encontrado. <Link to="/">Voltar</Link></p>
      ) : erro && <p className="status erro">{erro}</p>}

      {!carregando && !erro && pratos.length === 0 && (
        <p className="status">O cardápio desta loja está sendo preparado. Volte em breve!</p>
      )}

      <ul className="lista">
        {visiveis.map((p) => {
          const tem3d = Boolean(p.modelo_glb_url)
          return (
            <li key={p.id}>
              <button className="card" onClick={() => tem3d && setAberto(p)} disabled={!tem3d}>
                <div className="thumb">
                  {p.imagem_url ? (
                    <img src={p.imagem_url} alt="" loading="lazy" />
                  ) : tem3d ? (
                    <model-viewer src={p.modelo_glb_url} auto-rotate interaction-prompt="none"
                      style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
                  ) : (
                    <span className="sem-foto">🍽️</span>
                  )}
                  {tem3d && <span className="tag3d flutuante">3D · AR</span>}
                </div>
                <div className="info">
                  <h3>{p.nome}</h3>
                  {p.descricao && <p>{p.descricao}</p>}
                  <span className="preco">{formatarPreco(p.preco)}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {aberto && <Visualizador3D prato={aberto} onFechar={() => setAberto(null)} />}
    </main>
  )
}
