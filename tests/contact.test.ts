import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { VercelRequest, VercelResponse } from '@vercel/node'

process.env.NODE_ENV = 'production'
process.env.RESEND_KEY = 'test-key'
process.env.TURNSTILE_SECRET_KEY = 'test-secret'

const { default: handler } = await import('../api/contact')
const request = {
  method: 'POST',
  headers: { origin: 'https://tomstiani.com' },
  body: { name: 'Test', email: 'test@example.com', message: 'Hello there', 'cf-turnstile-response': 'token' },
} as VercelRequest

async function response(): Promise<{ status: number; body: unknown }> {
  const result = { status: 0, body: null as unknown }
  const res = {
    status(code: number) { result.status = code; return this },
    json(body: unknown) { result.body = body; return this },
  } as unknown as VercelResponse
  await handler(request, res)
  return result
}

const unavailable = { status: 502, body: { error: 'Failed to send message. Please try again.' } }

test('returns JSON when Turnstile is unavailable', async () => {
  globalThis.fetch = async () => { throw new Error('network unavailable') }
  assert.deepEqual(await response(), unavailable)
})

test('returns JSON when Resend is unavailable', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('turnstile')) return new Response('{"success":true}', { status: 200 })
    throw new Error('network unavailable')
  }
  assert.deepEqual(await response(), { ...unavailable, status: 500 })
})
