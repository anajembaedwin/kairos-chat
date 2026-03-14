import nodemailer from 'nodemailer'

type SendMagicLinkArgs = {
  to: string
  link: string
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
  const transport = getTransport()

  if (!transport) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email transport is not configured')
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

