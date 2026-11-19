import { useEffect } from 'react'

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const ehIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)
const ehAndroid = /Android/i.test(ua)

const APPS = [
  {
    nome: 'KIRI Engine',
    desc: 'Gratuito, funciona em qualquer celular. Bom para comida.',
    ios: 'https://apps.apple.com/app/id1577127142',
    android: 'https://play.google.com/store/search?q=KIRI%20Engine&c=apps',
    site: 'https://www.kiriengine.app'
  },
  {
    nome: 'Polycam',
    desc: 'Muito fácil de usar; plano grátis com limite de fotos.',
    ios: 'https://poly.cam',
    android: 'https://play.google.com/store/search?q=Polycam&c=apps',
    site: 'https://poly.cam'
  }
]

const linkDoApp = (app) => (ehIOS ? app.ios : ehAndroid ? app.android : app.site)

export default function GuiaEscaneamento({ onFechar, onJaTenhoArquivo }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onFechar])

  return (
    <div className="guia-fundo" role="dialog" aria-modal="true" aria-label="Como escanear o prato" onClick={onFechar}>
      <div className="guia" onClick={(e) => e.stopPropagation()}>
        <div className="guia-topo">
          <h2>📸 Escanear prato em 3D</h2>
          <button className="btn-fechar" onClick={onFechar} aria-label="Fechar">✕</button>
        </div>

        <h3>1. Abra um app de escaneamento</h3>
        <div className="guia-apps">
          {APPS.map((a) => (
            <a key={a.nome} className="guia-app" href={linkDoApp(a)} target="_blank" rel="noreferrer">
              <strong>{a.nome}</strong>
              <span>{a.desc}</span>
            </a>
          ))}
        </div>

        <h3>2. Prepare o prato</h3>
        <ul>
          <li>Luz clara e uniforme, <b>sem sol direto</b> e sem sombra forte.</li>
          <li>Prato no centro de uma mesa lisa e fosca (evite toalha estampada e vidro).</li>
          <li>Se tiver, use um <b>prato giratório</b> (suporte de bolo serve).</li>
          <li>Evite molho muito brilhante; seque o excesso de óleo.</li>
        </ul>

        <h3>3. Escaneie</h3>
        <ul>
          <li>No app, escolha <b>Photo Scan</b> / <b>Photo Mode</b>.</li>
          <li>Dê <b>3 voltas</b> em volta do prato: uma baixa, uma na altura média e uma de cima.</li>
          <li>Tire de <b>40 a 80 fotos</b>, sempre com o prato inteiro aparecendo.</li>
          <li>Não mexa no prato durante o escaneamento.</li>
        </ul>

        <h3>4. Exporte e envie</h3>
        <ul>
          <li>No app, exporte em <b>GLB</b> (e, se tiver iPhone, também em <b>USDZ</b>).</li>
          <li>Escolha qualidade <b>média</b> — o arquivo precisa ter até 30 MB (ideal: até 5 MB, carrega rápido).</li>
          <li>Salve no celular e volte para esta tela.</li>
        </ul>

        <button className="btn primario guia-ok" onClick={onJaTenhoArquivo}>Já tenho o arquivo — enviar</button>
      </div>
    </div>
  )
}
