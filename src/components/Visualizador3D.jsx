import { useEffect } from 'react'
import { formatarPreco } from '../lib/supabase'

// Abre o prato em 3D. No celular, o botão "Ver na minha mesa" abre a câmera em AR:
// Android → Scene Viewer / WebXR, iPhone → Quick Look (usa o .usdz se houver,
// senão o model-viewer gera um a partir do .glb).
export default function Visualizador3D({ prato, onFechar }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [onFechar])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={prato.nome}>
      <div className="modal-topo">
        <div>
          <h2>{prato.nome}</h2>
          <span className="preco">{formatarPreco(prato.preco)}</span>
        </div>
        <button className="btn-fechar" onClick={onFechar} aria-label="Fechar">✕</button>
      </div>

      <model-viewer
        src={prato.modelo_glb_url}
        ios-src={prato.modelo_usdz_url || undefined}
        poster={prato.imagem_url || undefined}
        alt={`Modelo 3D de ${prato.nome}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-placement="floor"
        ar-scale="fixed"
        camera-controls
        touch-action="pan-y"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="20deg"
        shadow-intensity="1"
        exposure="1"
        style={{ width: '100%', flex: 1, background: 'transparent' }}
      >
        <button slot="ar-button" className="btn-ar">📱 Ver na minha mesa</button>
        <div slot="progress-bar" />
      </model-viewer>

      {prato.descricao && <p className="modal-desc">{prato.descricao}</p>}
      <p className="dica">Arraste para girar · pinça para dar zoom</p>
    </div>
  )
}
