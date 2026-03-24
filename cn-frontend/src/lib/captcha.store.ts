// src/lib/captcha.store.ts

interface CaptchaEntry {
  text: string
  expiresAt: number
}

// Map simple en memoria — clave: captchaId, valor: texto esperado + expiración
const store = new Map<string, CaptchaEntry>()

// Limpieza automática cada 5 minutos de captchas vencidos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export const captchaStore = {
  set(id: string, text: string) {
    store.set(id, {
      text: text.toLowerCase(),
      expiresAt: Date.now() + 5 * 60 * 1000 // expira en 5 minutos
    })
  },

  verify(id: string, input: string): boolean {
    const entry = store.get(id)
    if (!entry) return false                          // no existe
    if (entry.expiresAt < Date.now()) {               // expiró
      store.delete(id)
      return false
    }
    store.delete(id)                                  // un solo uso
    return entry.text === input.toLowerCase().trim()
  }
}