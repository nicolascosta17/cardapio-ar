import { Component, lazy } from 'react'

// Depois de uma atualização do site, abas antigas tentam baixar arquivos que não existem mais.
// Nesse caso recarrega a página uma vez (sem entrar em loop).
const CHAVE = 'recarregou-apos-atualizacao'
const ehErroDeVersao = (e) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i
    .test(String(e?.message || e))

export function lazyComRecarga(importar) {
  return lazy(() =>
    importar()
      .then((m) => { try { sessionStorage.removeItem(CHAVE) } catch { /* ignora */ } return m })
      .catch((e) => {
        let jaRecarregou = false
        try { jaRecarregou = sessionStorage.getItem(CHAVE) === '1' } catch { /* ignora */ }
        if (ehErroDeVersao(e) && !jaRecarregou) {
          try { sessionStorage.setItem(CHAVE, '1') } catch { /* ignora */ }
          window.location.reload()
          return new Promise(() => {}) // espera a recarga
        }
        throw e
      })
  )
}

// Se algo quebrar na tela, mostra uma mensagem em vez de tela branca
export class ErroGeral extends Component {
  state = { erro: null }
  static getDerivedStateFromError(erro) { return { erro } }
  componentDidCatch(erro, info) { console.error('Erro na tela:', erro, info) }
  render() {
    if (!this.state.erro) return this.props.children
    return (
      <main className="admin login">
        <h1>Ops, algo deu errado</h1>
        <p className="erro">A página encontrou um problema. Recarregar costuma resolver.</p>
        <button className="btn primario" onClick={() => window.location.reload()}>Recarregar</button>
        <a className="btn" href="/">Ir para o início</a>
      </main>
    )
  }
}
