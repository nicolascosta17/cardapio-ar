import { Link } from 'react-router-dom'

// Página inicial da plataforma (cada restaurante usa o próprio link: /nome-da-loja)
export default function Inicio() {
  return (
    <main className="cardapio inicio">
      <header className="hero">
        <p className="sobre">Cardápio em realidade aumentada</p>
        <h1>Seu prato em 3D, em cima da mesa do cliente.</h1>
        <p>O cliente aponta a câmera para o QR code, escolhe o prato e vê como ele chega — em tamanho real, sem instalar nada.</p>
      </header>
      <div className="linha">
        <Link className="btn primario" to="/demo">Ver demonstração</Link>
        <Link className="btn" to="/admin/login">Área do restaurante</Link>
      </div>
    </main>
  )
}
