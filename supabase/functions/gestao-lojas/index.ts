// Gestão de lojas — só o dono da plataforma (tabela public.admins) pode usar.
// Ações:
//   criar_loja  { nome, slug, email }      → cria a loja, o usuário responsável e devolve o link de acesso
//   gerar_link  { loja_id, email }         → (re)gera link de acesso e vincula o e-mail à loja
//   remover_membro { loja_id, user_id }    → tira o acesso de alguém à loja
import { createClient } from 'npm:@supabase/supabase-js@2'

const ORIGENS = ['https://3dcardapio.netlify.app', 'http://localhost:5173']
const SITE = 'https://3dcardapio.netlify.app'

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ORIGENS.includes(origin) ? origin : SITE,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
})

const SLUG_OK = /^[a-z0-9]+(-[a-z0-9]+)*$/
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const headers = { ...cors(origin), 'Content-Type': 'application/json' }
  const resp = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return resp({ erro: 'Método não permitido' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  // 1) Quem está chamando? (token validado no servidor de auth)
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: { user }, error: errUser } = await service.auth.getUser(token)
  if (errUser || !user) return resp({ erro: 'Não autenticado' }, 401)

  // 2) É dono da plataforma?
  const { data: adm } = await service.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!adm) return resp({ erro: 'Sem permissão' }, 403)

  let body: Record<string, string>
  try { body = await req.json() } catch { return resp({ erro: 'JSON inválido' }, 400) }

  const redirectTo = `${origin && ORIGENS.includes(origin) ? origin : SITE}/admin/nova-senha`

  // Garante que o usuário existe e devolve { userId, link }
  async function linkPara(email: string) {
    const inv = await service.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
    if (!inv.error) return { userId: inv.data.user.id, link: inv.data.properties.action_link, novo: true }
    // Já existe: gera link de redefinição de senha
    const rec = await service.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
    if (rec.error) throw rec.error
    return { userId: rec.data.user.id, link: rec.data.properties.action_link, novo: false }
  }

  try {
    if (body.acao === 'criar_loja') {
      const nome = String(body.nome || '').trim()
      const slug = String(body.slug || '').trim().toLowerCase()
      const email = String(body.email || '').trim().toLowerCase()
      if (nome.length < 2) return resp({ erro: 'Informe o nome da loja.' }, 400)
      if (!SLUG_OK.test(slug) || slug.length < 3 || slug.length > 40) return resp({ erro: 'Endereço inválido: use letras minúsculas, números e hífen (3 a 40).' }, 400)
      if (!EMAIL_OK.test(email)) return resp({ erro: 'E-mail do responsável inválido.' }, 400)

      const { data: loja, error: errLoja } = await service.from('lojas').insert({ nome, slug }).select().single()
      if (errLoja) {
        if (errLoja.code === '23505') return resp({ erro: 'Esse endereço já está em uso. Escolha outro.' }, 409)
        if (errLoja.code === '23514') return resp({ erro: 'Endereço reservado ou inválido. Escolha outro.' }, 400)
        throw errLoja
      }
      try {
        const { userId, link, novo } = await linkPara(email)
        const { error: errM } = await service.from('loja_membros').insert({ loja_id: loja.id, user_id: userId })
        if (errM) throw errM
        return resp({ loja, link, novo })
      } catch (e) {
        await service.from('lojas').delete().eq('id', loja.id) // desfaz a loja se o usuário falhar
        throw e
      }
    }

    if (body.acao === 'gerar_link') {
      const email = String(body.email || '').trim().toLowerCase()
      if (!EMAIL_OK.test(email)) return resp({ erro: 'E-mail inválido.' }, 400)
      const { data: loja } = await service.from('lojas').select('id').eq('id', body.loja_id).maybeSingle()
      if (!loja) return resp({ erro: 'Loja não encontrada.' }, 404)
      const { userId, link, novo } = await linkPara(email)
      await service.from('loja_membros').upsert({ loja_id: loja.id, user_id: userId }, { onConflict: 'loja_id,user_id', ignoreDuplicates: true })
      return resp({ link, novo })
    }

    if (body.acao === 'listar_membros') {
      const { data: membros } = await service.from('loja_membros').select('user_id').eq('loja_id', body.loja_id)
      const lista = []
      for (const m of membros || []) {
        const { data } = await service.auth.admin.getUserById(m.user_id)
        lista.push({ user_id: m.user_id, email: data.user?.email, ja_entrou: Boolean(data.user?.last_sign_in_at) })
      }
      return resp({ membros: lista })
    }

    if (body.acao === 'remover_membro') {
      await service.from('loja_membros').delete().eq('loja_id', body.loja_id).eq('user_id', body.user_id)
      return resp({ ok: true })
    }

    return resp({ erro: 'Ação desconhecida' }, 400)
  } catch (e) {
    console.error(e)
    return resp({ erro: 'Erro interno. Tente novamente.' }, 500)
  }
})
