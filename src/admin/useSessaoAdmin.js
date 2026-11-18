import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const INATIVIDADE_MS = 30 * 60 * 1000 // sai sozinho após 30 min parado

// Estado: 'carregando' | 'deslogado' | 'negado' | 'admin'
export function useSessaoAdmin() {
  const [estado, setEstado] = useState('carregando')
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    let ativo = true

    const verificar = async (session) => {
      if (!session) {
        if (ativo) { setUsuario(null); setEstado('deslogado') }
        return
      }
      // getUser() valida o token no servidor (não confia só no que está no navegador)
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        await supabase.auth.signOut()
        if (ativo) setEstado('deslogado')
        return
      }
      const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
      if (!ativo) return
      setUsuario(user)
      setEstado(data ? 'admin' : 'negado')
    }

    supabase.auth.getSession().then(({ data }) => verificar(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === 'SIGNED_OUT') { setUsuario(null); setEstado('deslogado') }
      else if (evento === 'SIGNED_IN' || evento === 'USER_UPDATED') verificar(session)
    })
    return () => { ativo = false; sub.subscription.unsubscribe() }
  }, [])

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

  return { estado, usuario }
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
