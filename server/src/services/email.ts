import nodemailer from 'nodemailer'

type SendMagicLinkArgs = {
  to: string
  link: string
}

const sendWithResend = async (args: { to: string; from: string; link: string }) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: args.from,
      to: args.to,
      subject: 'Your sign-in link',
      text: `Sign in using this link: ${args.link}`,
      html: `<p>Sign in using this link:</p><p><a href="${args.link}">${args.link}</a></p>`,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend send failed (${res.status}): ${body || res.statusText}`)
  }

  return true
}

const getTransport = () => {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export const sendMagicLinkEmail = async ({ to, link }: SendMagicLinkArgs) => {
  const from = process.env.EMAIL_FROM || 'no-reply@kairos-chat.local'

  // Best practical approach:
  // - Prefer Resend in production (API-based, fewer SMTP issues)
  // - Fall back to SMTP if configured
  // - In dev, print the link when no provider is configured
  const sentWithResend = await sendWithResend({ to, from, link })
  if (sentWithResend) return

  const transport = getTransport()

  if (!transport) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email provider is not configured (set RESEND_API_KEY or SMTP_* env vars)')
    }
    console.log(`[dev] Magic link for ${to}: ${link}`)
    return
  }

  await transport.sendMail({
    from,
    to,
    subject: 'Your sign-in link',
    text: `Sign in using this link: ${link}`,
    html: `<p>Sign in using this link:</p><p><a href="${link}">${link}</a></p>`,
  })
}
