// Recebe um "identificador" digitado no login (e-mail ou nome de usuário) e,
// se for um nome de usuário cadastrado, devolve o e-mail correspondente para
// o front-end usar no signInWithPassword. Não exige login (verify_jwt=false),
// então tem limite de tentativas por IP para não virar uma forma de "adivinhar"
// nomes de usuário cadastrados.
import { createClient } from 'npm:@supabase/supabase-js@2'

const ORIGENS = ['https://3dcardapio.netlify.app', 'http://localhost:5173']
const SITE = 'https://3dcardapio.netlify.app'

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ORIGENS.includes(origin) ? origin : SITE,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
})

const JANELA_MS = 10 * 60 * 1000 // 10 minutos
const LIMITE_TENTATIVAS = 30

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const headers = { ...cors(origin), 'Content-Type': 'application/json' }
  const resp = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return resp({ erro: 'Método não permitido' }, 405)

  let body: Record<string, string>
  try { body = await req.json() } catch { return resp({ erro: 'JSON inválido' }, 400) }

  const identificador = String(body.identificador || '').trim().toLowerCase()
  if (!identificador) return resp({ email: null })

  // E-mail: devolve direto, sem precisar olhar o banco.
  if (identificador.includes('@')) return resp({ email: identificador })

  const service = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  // Limite por IP: evita usar isso para descobrir, por tentativa e erro,
  // quais nomes de usuário existem.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'desconhecido'
  const agora = new Date()
  const privado = service.schema('privado')
  const { data: registro } = await privado
    .from('tentativas_consulta_usuario')
    .select('tentativas, janela_inicio')
    .eq('chave', ip)
    .maybeSingle()

  if (registro) {
    const inicio = new Date(registro.janela_inicio).getTime()
    if (agora.getTime() - inicio > JANELA_MS) {
      await privado.from('tentativas_consulta_usuario').update({ tentativas: 1, janela_inicio: agora.toISOString() }).eq('chave', ip)
    } else if (registro.tentativas >= LIMITE_TENTATIVAS) {
      return resp({ email: null }) // limite atingido: responde como "não encontrado"
    } else {
      await privado.from('tentativas_consulta_usuario').update({ tentativas: registro.tentativas + 1 }).eq('chave', ip)
    }
  } else {
    await privado.from('tentativas_consulta_usuario').insert({ chave: ip, tentativas: 1, janela_inicio: agora.toISOString() })
  }

  const { data: perfil } = await service.from('perfis').select('user_id').eq('username', identificador).maybeSingle()
  if (!perfil) return resp({ email: null })

  const { data } = await service.auth.admin.getUserById(perfil.user_id)
  return resp({ email: data.user?.email || null })
})
