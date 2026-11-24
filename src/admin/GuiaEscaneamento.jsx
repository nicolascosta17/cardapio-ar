import { useEffect } from 'react'

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const ehIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)
const ehAndroid = /Android/i.test(ua)

const APPS = [
  {
    nome: 'KIRI Engine',
    desc: 'Gratuito, funciona em qualquer celular. Bom para comida.',
    ios: 'https://apps.apple.com/app/id1577127142',
    android: 'https://play.google.com/store/apps/details?id=com.kiriengine.app',
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

        <h3>2. Monte o cenário (isso é o que mais muda o resultado)</h3>
        <ul>
          <li><b>Fundo liso de uma cor só</b> (papelão branco, cartolina preta fosca ou uma folha de isopor) — é o que deixa o app recortar o prato do fundo automaticamente, sem "sujeira" ao redor do modelo.</li>
          <li>Luz difusa e uniforme vinda de <b>vários ângulos</b> (perto de uma janela num dia claro, ou 2 luminárias de lados opostos) — <b>sem sol direto</b> e sem uma sombra forte só de um lado.</li>
          <li>Se tiver, use um <b>prato giratório</b> (suporte de bolo ou bandeja giratória de cozinha) — gira o prato, não a câmera, então a luz e o fundo ficam sempre iguais nas fotos.</li>
          <li>Evite molho muito brilhante ou poças de líquido; seque o excesso de óleo. Brilho forte confunde o app e deixa "buracos" no modelo.</li>
        </ul>

        <h3>3. Escaneie como num giro de câmera fixa</h3>
        <ul>
          <li>No app, escolha <b>Photo Scan</b> / <b>Photo Mode</b> (não é vídeo).</li>
          <li>Trave a altura e a distância do celular e dê a volta só <b>andando ao redor</b> (ou gire o prato, se tiver o suporte giratório) — isso evita fotos tremidas e fora de foco.</li>
          <li>Faça <b>3 voltas completas</b> com o prato sempre centralizado: uma baixa (quase na altura da mesa), uma na altura do prato e uma de cima, olhando para baixo.</li>
          <li>Tire de <b>60 a 100 fotos</b> no total — mude pouco o ângulo entre uma foto e outra (o app sugere isso na tela).</li>
          <li>Não mexa no prato nem no fundo durante o escaneamento; espere a comida "assentar" antes de começar.</li>
        </ul>

        <h3>4. Exporte e envie</h3>
        <ul>
          <li>No app, exporte em <b>GLB</b> (e, se tiver iPhone, também em <b>USDZ</b>).</li>
          <li>Escolha qualidade <b>média</b> — o arquivo precisa ter até 30 MB (ideal: até 5 MB, carrega rápido).</li>
          <li>Se o app mostrar uma prévia com o fundo ainda aparecendo, use a ferramenta de <b>recorte/máscara</b> (object mask) antes de exportar.</li>
          <li>Salve no celular e volte para esta tela.</li>
        </ul>

        <button className="btn primario guia-ok" onClick={onJaTenhoArquivo}>Já tenho o arquivo — enviar</button>
      </div>
    </div>
  )
}
