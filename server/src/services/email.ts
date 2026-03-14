import nodemailer from 'nodemailer'

type SendMagicLinkArgs = {
  to: string
  link: string
}

const sendWithResend = async (args: { to: string; from: string; link: string }) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
      <p>Sign in to Kairos Chat:</p>
      <p>
        <a href="${args.link}" style="display:inline-block;background:#7c6af7;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600;">
          Sign in
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;">If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="font-size:12px;word-break:break-all;"><span>${args.link}</span></p>
    </div>
  `

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
      html,
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
    text: `Sign in to Kairos Chat:\n\n${link}\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
        <p>Sign in to Kairos Chat:</p>
        <p>
          <a href="${link}" style="display:inline-block;background:#7c6af7;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600;">
            Sign in
          </a>
        </p>
        <p style="color:#6b7280;font-size:12px;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="font-size:12px;word-break:break-all;">
          <span>${link}</span>
        </p>
      </div>
    `,
  })
}
