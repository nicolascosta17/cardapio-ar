import { createClient } from '@supabase/supabase-js'

// A chave publishable é pública (vai para o navegador de qualquer jeito);
// quem protege os dados são as regras RLS do banco. Variáveis de ambiente têm prioridade.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://lqychiytrudrqroeljan.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6CLGusXj3qPEf22usBJBSg_Ym8Z3pCl'

export const supabase = createClient(url, key)

export const BUCKET = 'cardapio'

export const formatarPreco = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Regras de upload (o bucket também limita a 50 MB no servidor)
const REGRAS = {
  imagem: { exts: ['jpg', 'jpeg', 'png', 'webp'], maxMB: 5 },
  glb: { exts: ['glb'], maxMB: 30 },
  usdz: { exts: ['usdz'], maxMB: 30 }
}
export function validarArquivo(file, tipo) {
  const regra = REGRAS[tipo]
  const ext = file.name.split('.').pop().toLowerCase()
  if (!regra.exts.includes(ext)) return `formato inválido (use ${regra.exts.join(', ')}).`
  if (file.size > regra.maxMB * 1024 * 1024) return `arquivo maior que ${regra.maxMB} MB.`
  return null
}

// Envia um arquivo para o Storage e devolve a URL pública
export async function enviarArquivo(file, pasta) {
  const ext = file.name.split('.').pop().toLowerCase()
  const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`
  const contentType =
    ext === 'glb' ? 'model/gltf-binary' :
    ext === 'usdz' ? 'model/vnd.usdz+zip' :
    file.type || undefined
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, file, { contentType })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl
}
