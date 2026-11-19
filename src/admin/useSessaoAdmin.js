import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const INATIVIDADE_MS = 30 * 60 * 1000 // sai sozinho após 30 min parado

// estado: 'carregando' | 'deslogado' | 'negado' | 'admin' | 'erro'
// superAdmin: dono da plataforma (cadastra lojas)
// lojas: lojas que esta pessoa pode gerenciar (super admin vê todas)
export function useSessaoAdmin() {
  const [estado, setEstado] = useState('carregando')
  const [usuario, setUsuario] = useState(null)
  const [superAdmin, setSuperAdmin] = useState(false)
  const [lojas, setLojas] = useState([])

  const carregarLojas = useCallback(async (user, ehSuper) => {
    let lista = []
    if (ehSuper) {
      const { data } = await supabase.from('lojas').select('*').order('nome')
      lista = data || []
    } else {
      const { data } = await supabase.from('loja_membros').select('lojas(*)').eq('user_id', user.id)
      lista = (data || []).map((m) => m.lojas).filter(Boolean).sort((a, b) => a.nome.localeCompare(b.nome))
    }
    setLojas(lista)
    return lista
  }, [])

  useEffect(() => {
    let ativo = true

    const verificar = async (session) => {
      if (!session) {
        if (ativo) { setUsuario(null); setEstado('deslogado') }
        return
      }
      // getUser() valida o token no servidor (não confia só no que está no navegador)
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error && !error.status) { if (ativo) setEstado('erro'); return } // sem internet: não desloga
      if (error || !user) {
        await supabase.auth.signOut()
        if (ativo) setEstado('deslogado')
        return
      }
      const { data: adm, error: errAdm } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
      if (errAdm) { if (ativo) setEstado('erro'); return }
      const ehSuper = Boolean(adm)
      const lista = await carregarLojas(user, ehSuper)
      if (!ativo) return
      setUsuario(user)
      setSuperAdmin(ehSuper)
      setEstado(ehSuper || lista.length > 0 ? 'admin' : 'negado')
    }

    supabase.auth.getSession().then(({ data }) => verificar(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === 'SIGNED_OUT') { setUsuario(null); setSuperAdmin(false); setLojas([]); setEstado('deslogado') }
      // setTimeout: chamar o Supabase dentro deste aviso pode travar o login (recomendação do Supabase)
      else if (evento === 'SIGNED_IN' || evento === 'USER_UPDATED') setTimeout(() => verificar(session), 0)
    })
    return () => { ativo = false; sub.subscription.unsubscribe() }
  }, [carregarLojas])

  // Logout automático por inatividade
  useEffect(() => {
    if (estado !== 'admin') return
    let timer
    const reiniciar = () => {
      clearTimeout(timer)
      timer = setTimeout(() => supabase.auth.signOut(), INATIVIDADE_MS)
    }
    const eventos = ['pointerdown', 'keydown', 'scroll']
    eventos.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }))
    reiniciar()
    return () => {
      clearTimeout(timer)
      eventos.forEach((e) => window.removeEventListener(e, reiniciar))
    }
  }, [estado])

  const recarregarLojas = useCallback(() => usuario && carregarLojas(usuario, superAdmin), [usuario, superAdmin, carregarLojas])

  return { estado, usuario, superAdmin, lojas, recarregarLojas }
}

// Pede para buscadores não indexarem as páginas do admin
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
}
