import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { contactSchema } from '../src/lib/contactSchema.js'

const ALLOWED_ORIGIN = 'https://tomstiani.com'
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const RESEND_KEY = process.env.RESEND_KEY
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY
const IS_PROD = process.env.NODE_ENV === 'production'

if (!RESEND_KEY) throw new Error('Missing env var: RESEND_KEY')
if (IS_PROD && !TURNSTILE_SECRET_KEY) throw new Error('Missing env var: TURNSTILE_SECRET_KEY')

const resend = new Resend(RESEND_KEY)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Reject requests not originating from the site in production
  const origin = req.headers.origin
  if (origin && origin !== ALLOWED_ORIGIN && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { website, 'cf-turnstile-response': turnstileToken, ...fields } = req.body ?? {}

  // Honeypot — bots fill the hidden `website` field, humans don't
  if (website) {
    // Return 200 so bots don't know they've been caught
    return res.status(200).json({ ok: true })
  }

  const parsed = contactSchema.safeParse(fields)
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map(e => [e.path[0], e.message])
    )
    return res.status(400).json({ error: 'Validation failed.', fieldErrors })
  }

  const { name, email, message } = parsed.data

  if (IS_PROD) {
    if (!turnstileToken) {
      return res.status(400).json({ error: 'Missing challenge token.' })
    }

    const turnstileRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: (() => {
          const xff = req.headers['x-forwarded-for']
          return (Array.isArray(xff) ? xff[0] : xff?.split(',')[0]?.trim()) ?? req.socket?.remoteAddress
        })(),
      }),
    })

    const turnstileData = await turnstileRes.json() as { success: boolean }

    if (!turnstileData.success) {
      return res.status(400).json({ error: 'Challenge verification failed.' })
    }
  }

  const { error } = await resend.emails.send({
    from: 'Contact Form <hello@send.tomstiani.com>',
    to: 'hello@tomstiani.com',
    replyTo: email,
    subject: `New message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
  })

  if (error) {
    console.error('Resend error:', error)
    return res.status(500).json({ error: 'Failed to send message. Please try again.' })
  }

  return res.status(200).json({ ok: true })
}
