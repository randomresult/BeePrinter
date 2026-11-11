import { apiFehler } from '~/utils/format'

/** Kleine Hilfe für Admin-Aktionen: Ladezustand + Rückmeldung (Toast) */
export function useToast() {
  const toast = useState<{ text: string, kind: 'ok' | 'error' } | null>('toast', () => null)
  let timer: ReturnType<typeof setTimeout> | undefined
  function show(text: string, kind: 'ok' | 'error' = 'ok') {
    toast.value = { text, kind }
    clearTimeout(timer)
    timer = setTimeout(() => (toast.value = null), kind === 'error' ? 6000 : 3000)
  }
  return { toast, show }
}

export function useAction() {
  const busy = ref(false)
  const { show } = useToast()
  async function run<T>(fn: () => Promise<T>, success?: string | ((r: T) => string)): Promise<T | undefined> {
    busy.value = true
    try {
      const r = await fn()
      if (success) show(typeof success === 'function' ? success(r) : success)
      return r
    }
    catch (err) {
      show(apiFehler(err), 'error')
      return undefined
    }
    finally {
      busy.value = false
    }
  }
  return { busy, run }
}
