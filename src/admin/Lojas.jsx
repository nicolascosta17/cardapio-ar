import { useState } from 'react'
import { supabase, enviarArquivo, validarArquivo } from '../lib/supabase'

// Transforma "Bar do Zé & Cia" em "bar-do-ze-cia"
export const gerarSlug = (texto) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

async function chamar(acao, dados) {
  const { data, error } = await supabase.functions.invoke('gestao-lojas', { body: { acao, ...dados } })
  if (error) {
    // Lê a mensagem de erro que a função devolveu
    let msg = error.message
    try { msg = (await error.context.json()).erro || msg } catch { /* ignora */ }
    throw new Error(msg)
  }
  return data
}

// O arquivo fica no Storage da própria empresa.
async function salvarLogoLoja(lojaId, arquivo) {
  const url = await enviarArquivo(arquivo, lojaId + '/logos')
  const { error } = await supabase.from('lojas').update({ logo_url: url }).eq('id', lojaId)
  if (error) throw error
  return url
}

function LinkAcesso({ link, email, loja }) {
  const [copiado, setCopiado] = useState(false)
  const texto = `Olá! Seu acesso ao cardápio 3D da ${loja.nome} está pronto. Abra este link para criar sua senha: ${link}\n\nDepois, entre sempre por: ${window.location.origin}/admin/login (usuário: ${email})`
  const copiar = async () => {
    try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { /* ignora */ }
  }
  return (
    <div className="link-acesso">
      <p><strong>Link de acesso para {email}</strong><br />
        Envie para o responsável. Vale por pouco tempo e só pode ser usado uma vez.</p>
      <input readOnly value={link} onFocus={(e) => e.target.select()} />
      <div className="linha">
        <button type="button" className="btn" onClick={copiar}>{copiado ? 'Copiado!' : 'Copiar link'}</button>
        <a className="btn primario" href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer">Enviar no WhatsApp</a>
      </div>
    </div>
  )
}

function NovaLoja({ recarregar }) {
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [logo, setLogo] = useState(null)
  const [avisoLogo, setAvisoLogo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [criada, setCriada] = useState(null)

  const mudarNome = (v) => { setNome(v); if (!slugManual) setSlug(gerarSlug(v)) }
  const escolherLogo = (e) => {
    const arquivo = e.target.files?.[0] || null
    const problema = arquivo && validarArquivo(arquivo, 'imagem')
    if (problema) {
      setErro('Logo: ' + problema)
      setLogo(null)
      e.target.value = ''
      return
    }
    setErro('')
    setLogo(arquivo)
  }

  const salvar = async (e) => {
    e.preventDefault()
    const formulario = e.currentTarget
    setErro(''); setAvisoLogo(''); setSalvando(true)
    try {
      const r = await chamar('criar_loja', { nome, slug, email, username: username.trim().toLowerCase() })
      // Se o upload falhar, preservamos a empresa e o link de acesso criados.
      if (logo) {
        try {
          await salvarLogoLoja(r.loja.id, logo)
        } catch (err) {
          setAvisoLogo('Empresa cadastrada, mas não foi possível salvar a logo: ' + err.message + '. Use a opção Logo na empresa abaixo para tentar novamente.')
        }
      }
      setCriada({ ...r, email })
      setNome(''); setSlug(''); setEmail(''); setUsername(''); setLogo(null); setSlugManual(false)
      formulario.reset()
      await recarregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="form card-form">
      <h2>Cadastrar empresa</h2>
      <label>Nome da loja
        <input value={nome} onChange={(e) => mudarNome(e.target.value)} placeholder="Ex.: Qué Vino Wine Bar" required minLength={2} />
      </label>
      <label>Endereço do cardápio
        <div className="slug">
          <span>{window.location.host}/</span>
          <input value={slug} onChange={(e) => { setSlugManual(true); setSlug(gerarSlug(e.target.value)) }} required minLength={3} maxLength={40} />
        </div>
      </label>
      <label>E-mail do responsável
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dono@restaurante.com" required />
      </label>
      <label>Logomarca da empresa (opcional)
        <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={escolherLogo} />
        <small className="email">JPG, PNG ou WebP, até 5 MB.</small>
      </label>
      <label>Nome de usuário (opcional, para entrar sem digitar o e-mail)
        <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="ex: querestaurante" minLength={3} maxLength={20} />
      </label>
      {erro && <p className="erro">{erro}</p>}
      {avisoLogo && <p className="erro">{avisoLogo}</p>}
      <button className="btn primario" disabled={salvando}>{salvando ? 'Criando…' : 'Cadastrar loja'}</button>
      {criada && (
        <>
          <p className="ok">Loja “{criada.loja.nome}” criada! Cardápio: <a href={`/${criada.loja.slug}`} target="_blank" rel="noreferrer">{window.location.host}/{criada.loja.slug}</a></p>
          <LinkAcesso link={criada.link} email={criada.email} loja={criada.loja} />
        </>
      )}
    </form>
  )
}

function CartaoLoja({ loja, recarregar, onAbrirCardapio }) {
  const [aberto, setAberto] = useState(false)
  const [membros, setMembros] = useState(null)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [link, setLink] = useState(null)
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [editandoLogo, setEditandoLogo] = useState(false)
  const [novaLogo, setNovaLogo] = useState(null)
  const [ocupadoLogo, setOcupadoLogo] = useState(false)

  const abrir = async () => {
    setAberto((v) => !v)
    if (!membros) {
      try { setMembros((await chamar('listar_membros', { loja_id: loja.id })).membros) } catch (e) { setMsg('Erro: ' + e.message) }
    }
  }

  const gerarLink = async (e) => {
    e.preventDefault()
    setMsg(''); setOcupado(true)
    try {
      const r = await chamar('gerar_link', { loja_id: loja.id, email, username: username.trim().toLowerCase() })
      setLink({ link: r.link, email })
      setMembros((await chamar('listar_membros', { loja_id: loja.id })).membros)
      setEmail(''); setUsername('')
    } catch (err) { setMsg('Erro: ' + err.message) } finally { setOcupado(false) }
  }

  const remover = async (m) => {
    if (!window.confirm(`Tirar o acesso de ${m.email} à ${loja.nome}?`)) return
    try {
      await chamar('remover_membro', { loja_id: loja.id, user_id: m.user_id })
      setMembros(membros.filter((x) => x.user_id !== m.user_id))
    } catch (err) { setMsg('Erro: ' + err.message) }
  }

  const escolherNovaLogo = (e) => {
    const arquivo = e.target.files?.[0] || null
    const problema = arquivo && validarArquivo(arquivo, 'imagem')
    if (problema) {
      setMsg('Erro: ' + problema)
      setNovaLogo(null)
      e.target.value = ''
      return
    }
    setMsg('')
    setNovaLogo(arquivo)
  }

  const atualizarLogo = async (e) => {
    e.preventDefault()
    if (!novaLogo) return
    setOcupadoLogo(true); setMsg('')
    try {
      await salvarLogoLoja(loja.id, novaLogo)
      setNovaLogo(null)
      setEditandoLogo(false)
      await recarregar()
      setMsg('Logo atualizada com sucesso.')
    } catch (err) {
      setMsg('Erro: ' + err.message)
    } finally {
      setOcupadoLogo(false)
    }
  }

  const removerLogo = async () => {
    if (!window.confirm('Remover a logo de ' + loja.nome + '?')) return
    setOcupadoLogo(true); setMsg('')
    try {
      const { error } = await supabase.from('lojas').update({ logo_url: null }).eq('id', loja.id)
      if (error) throw error
      setNovaLogo(null)
      setEditandoLogo(false)
      await recarregar()
      setMsg('Logo removida do cardápio.')
    } catch (err) {
      setMsg('Erro: ' + err.message)
    } finally {
      setOcupadoLogo(false)
    }
  }

  const alternarAtivo = async () => {
    const acao = loja.ativo ? 'desativar' : 'reativar'
    if (!window.confirm(`Deseja ${acao} a loja ${loja.nome}? ${loja.ativo ? 'O cardápio sai do ar.' : ''}`)) return
    const { error } = await supabase.from('lojas').update({ ativo: !loja.ativo }).eq('id', loja.id)
    if (error) setMsg('Erro: ' + error.message); else recarregar()
  }

  return (
    <li className={`cartao-loja ${loja.ativo ? '' : 'inativo'}`}>
      <div className="cartao-topo">
        <div>
          <h3 className="nome-com-logo">{loja.logo_url && <img className="logo-cartao" src={loja.logo_url} alt="" />} {loja.nome}</h3>
          <a href={`/${loja.slug}`} target="_blank" rel="noreferrer">{window.location.host}/{loja.slug}</a>
          {!loja.ativo && <span className="selo">desativada</span>}
        </div>
      </div>
      <div className="linha">
        <button className="btn" onClick={() => onAbrirCardapio(loja.id)}>Pratos</button>
        <button className="btn" onClick={() => { setEditandoLogo((v) => !v); setMsg('') }}>{editandoLogo ? 'Fechar logo' : 'Logo'}</button>
        <button className="btn" onClick={abrir}>{aberto ? 'Fechar' : 'Acessos'}</button>
        <button className={`btn ${loja.ativo ? 'perigo' : ''}`} onClick={alternarAtivo}>{loja.ativo ? 'Desativar' : 'Reativar'}</button>
      </div>
      {editandoLogo && (
        <form className="form acessos" onSubmit={atualizarLogo}>
          <label>Adicionar ou trocar logomarca
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={escolherNovaLogo} />
            <small className="email">JPG, PNG ou WebP, até 5 MB.</small>
          </label>
          <div className="linha">
            <button className="btn primario" disabled={!novaLogo || ocupadoLogo}>{ocupadoLogo ? 'Salvando…' : 'Salvar logo'}</button>
            {loja.logo_url && <button type="button" className="btn perigo" disabled={ocupadoLogo} onClick={removerLogo}>Remover logo</button>}
          </div>
        </form>
      )}
      {aberto && (
        <div className="acessos">
          <h4>Quem administra</h4>
          {membros === null ? <p className="email">Carregando…</p> : membros.length === 0 ? <p className="email">Ninguém ainda.</p> : (
            <ul>
              {membros.map((m) => (
                <li key={m.user_id}>
                  <span>{m.email}{m.username && <> · <strong>{m.username}</strong></>} <small>{m.ja_entrou ? '· já entrou' : '· ainda não entrou'}</small></span>
                  <button className="btn perigo" onClick={() => remover(m)}>Remover</button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={gerarLink} className="form">
            <label>Gerar link de acesso (novo responsável ou quem esqueceu a senha)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@restaurante.com" required />
            </label>
            <label>Nome de usuário (opcional)
              <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="ex: querestaurante" minLength={3} maxLength={20} />
            </label>
            <button className="btn primario" disabled={ocupado}>{ocupado ? 'Gerando…' : 'Gerar link'}</button>
          </form>
          {link && <LinkAcesso link={link.link} email={link.email} loja={loja} />}
        </div>
      )}
      {msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
    </li>
  )
}

export default function Lojas({ lojas, recarregar, onAbrirCardapio }) {
  return (
    <>
      <NovaLoja recarregar={recarregar} />
      <h2>Empresas cadastradas</h2>
      <ul className="lista-lojas">
        {lojas.map((l) => <CartaoLoja key={l.id} loja={l} recarregar={recarregar} onAbrirCardapio={onAbrirCardapio} />)}
      </ul>
    </>
  )
}
