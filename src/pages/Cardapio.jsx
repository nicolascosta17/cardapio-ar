import { useEffect, useMemo, useState } from 'react'
import { supabase, formatarPreco } from '../lib/supabase'
import Visualizador3D from '../components/Visualizador3D'

const NOME = import.meta.env.VITE_NOME_RESTAURANTE || 'Nosso Cardápio'

export default function Cardapio() {
  const [pratos, setPratos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    supabase
      .from('pratos')
      .select('*')
      .eq('ativo', true)
      .order('categoria')
      .order('ordem')
      .then(({ data, error }) => {
        if (error) setErro('Não foi possível carregar o cardápio.')
        else setPratos(data)
        setCarregando(false)
      })
  }, [])

  const categorias = useMemo(
    () => ['Todos', ...new Set(pratos.map((p) => p.categoria))],
    [pratos]
  )
  const visiveis = categoria === 'Todos' ? pratos : pratos.filter((p) => p.categoria === categoria)

  return (
    <main className="cardapio">
      <header className="hero">
        <p className="sobre">Cardápio em realidade aumentada</p>
        <h1>{NOME}</h1>
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
      {erro && <p className="status erro">{erro}</p>}

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
