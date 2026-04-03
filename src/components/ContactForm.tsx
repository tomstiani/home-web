import { useState, useEffect, useRef } from 'preact/hooks'
import { contactSchema, type ContactFieldErrors } from '../lib/contactSchema'

type FormState = 'idle' | 'loading' | 'success' | 'error'

interface Props {
  turnstileSiteKey: string | undefined
  isDev: boolean
}

export default function ContactForm({ turnstileSiteKey, isDev }: Props) {
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [turnstileToken, setTurnstileToken] = useState('')
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    // In dev the widget is bypassed — show a placeholder instead
    if (isDev || !turnstileSiteKey) return

    let pollId: ReturnType<typeof setTimeout>

    function mountWidget() {
      // Remove any previously rendered widget before re-mounting so
      // View Transitions back-navigation doesn't leave a stale widget
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
        setTurnstileToken('')
      }

      function renderWidget() {
        if (!widgetRef.current) return
        // window.turnstile may not be populated yet even if the script tag
        // exists — poll until it's ready
        if (!window.turnstile) {
          pollId = setTimeout(renderWidget, 50)
          return
        }
        widgetIdRef.current = window.turnstile.render(widgetRef.current, {
          sitekey: turnstileSiteKey,
          theme: 'dark',
          callback: (token: string) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
        })
      }

      if (!document.getElementById('cf-turnstile-script')) {
        const script = document.createElement('script')
        script.id = 'cf-turnstile-script'
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        script.onload = renderWidget
        document.head.appendChild(script)
      } else {
        renderWidget()
      }
    }

    mountWidget()
    // Re-mount on subsequent View Transitions navigations only — the initial
    // mount above covers the first load, and astro:page-load fires on that too
    // which would double-render without this guard
    let initialLoad = true
    function onPageLoad() {
      if (initialLoad) { initialLoad = false; return }
      mountWidget()
    }
    document.addEventListener('astro:page-load', onPageLoad)

    return () => {
      clearTimeout(pollId)
      document.removeEventListener('astro:page-load', onPageLoad)
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [])

  async function handleSubmit(e: Event) {
    e.preventDefault()

    const form = e.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form))

    // Client-side validation before hitting the network
    const parsed = contactSchema.safeParse(data)
    if (!parsed.success) {
      const errors = Object.fromEntries(
        parsed.error.errors.map(err => [err.path[0], err.message])
      ) as ContactFieldErrors
      setFieldErrors(errors)
      setState('error')
      return
    }

    setFieldErrors({})

    if (!isDev && !turnstileToken) {
      setErrorMsg('Please complete the challenge.')
      setState('error')
      return
    }

    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, 'cf-turnstile-response': turnstileToken }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Something went wrong.')
      }

      setState('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setState('error')
      // Reset Turnstile so user can try again
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
        setTurnstileToken('')
      }
    }
  }

  if (state === 'success') {
    return (
      <div class="flex items-start gap-3 px-5 py-4 rounded-lg bg-surface border border-border">
        <span class="mt-0.5 w-2 h-2 rounded-full bg-accent shrink-0" />
        <p class="text-sm text-text m-0">
          Message sent. I'll get back to you as soon as I can.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-5" noValidate>
      {/* Honeypot — hidden from real users, visible to bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autocomplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
      />

      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-text">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autocomplete="name"
          placeholder="Your name"
          class={`px-4 py-2.5 rounded-lg bg-surface border text-sm text-text placeholder:text-muted focus:outline-none transition-colors duration-150 ${fieldErrors.name ? 'border-red-500' : 'border-border focus:border-accent-hover'}`}
        />
        {fieldErrors.name && <p class="text-xs text-red-400 m-0">{fieldErrors.name}</p>}
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="email" class="text-sm font-medium text-text">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
          class={`px-4 py-2.5 rounded-lg bg-surface border text-sm text-text placeholder:text-muted focus:outline-none transition-colors duration-150 ${fieldErrors.email ? 'border-red-500' : 'border-border focus:border-accent-hover'}`}
        />
        {fieldErrors.email && <p class="text-xs text-red-400 m-0">{fieldErrors.email}</p>}
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="message" class="text-sm font-medium text-text">Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="What's on your mind?"
          class={`px-4 py-2.5 rounded-lg bg-surface border text-sm text-text placeholder:text-muted focus:outline-none transition-colors duration-150 resize-y ${fieldErrors.message ? 'border-red-500' : 'border-border focus:border-accent-hover'}`}
        />
        {fieldErrors.message && <p class="text-xs text-red-400 m-0">{fieldErrors.message}</p>}
      </div>

      {/* Turnstile widget — placeholder shown in dev to avoid real Cloudflare connections */}
      {isDev ? (
        <div class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border text-xs text-muted select-none">
          <span class="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          Turnstile bypassed in dev
        </div>
      ) : (
        <div ref={widgetRef} />
      )}

      {state === 'error' && errorMsg && (
        <p class="text-sm text-red-400 m-0">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === 'loading'}
        class="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-bg bg-accent hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}

// Extend window for Turnstile types
declare global {
  interface Window {
    turnstile: {
      render: (el: HTMLElement, opts: object) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
  }
}
