import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
}

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-20 border-b border-surface-border bg-surface/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-semibold">
              K
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Kairos Chat</div>
              <div className="text-xs text-ink-muted">Private sessions • Real-time</div>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <a className="text-sm text-ink-muted hover:text-ink transition-colors hidden sm:inline" href="#features">
              Features
            </a>
            <a className="text-sm text-ink-muted hover:text-ink transition-colors hidden sm:inline" href="#how">
              How it works
            </a>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium h-9 px-3 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-14 pb-10 sm:pt-20 sm:pb-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-center">
            <div>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border border-surface-border bg-surface-raised text-ink-muted">
                  End-to-end encrypted sessions
                </span>
              </motion.div>
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.08}
                className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight"
              >
                Real-time chat, built for short private sessions.
              </motion.h1>
              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.16}
                className="mt-4 text-ink-muted text-base sm:text-lg leading-relaxed max-w-xl"
              >
                Create a session link, invite one person, and chat securely — with a built-in timer that keeps things focused.
              </motion.p>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.24}
                className="mt-6 flex flex-col sm:flex-row gap-3"
              >
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white font-medium h-11 px-5 transition-colors"
                >
                  Start a session
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-raised hover:bg-surface-overlay text-ink font-medium h-11 px-5 transition-colors"
                >
                  See how it works
                </a>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.32}
                className="mt-8 grid grid-cols-3 gap-3 max-w-md"
              >
                {[
                  { k: '2', v: 'people per session' },
                  { k: '5m', v: 'built-in timer' },
                  { k: '0', v: 'stored plaintext' },
                ].map((s) => (
                  <div key={s.v} className="rounded-xl border border-surface-border bg-surface-raised px-3 py-3">
                    <div className="text-lg font-semibold">{s.k}</div>
                    <div className="text-xs text-ink-muted mt-1">{s.v}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.12 }}
              className="relative"
            >
              <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-gradient-to-tr from-accent/40 via-indigo-400/20 to-transparent" />
              <div className="rounded-2xl border border-surface-border bg-surface-raised p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Session preview</div>
                  <div className="text-xs text-ink-muted">Timer: 04:58</div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 rounded-full bg-surface-border flex items-center justify-center text-xs font-semibold text-ink-muted">
                      A
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-surface-border bg-surface-overlay px-4 py-3 text-sm">
                      Hey — got 5 minutes?
                      <div className="text-[11px] text-ink-faint mt-1">just now</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent text-white px-4 py-3 text-sm">
                      Yep. Share the link and let’s go.
                      <div className="text-[11px] text-white/70 mt-1">just now</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-white">
                      B
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-surface-border bg-surface px-4 py-3 text-xs text-ink-muted">
                  Encrypted in the browser. Stored in memory. Wiped when the session ends.
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold">Designed for privacy and focus</h2>
              <p className="text-ink-muted mt-2 max-w-2xl">
                Everything is built around lightweight, secure, two-person sessions — with a timer that keeps conversations intentional.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'End-to-end encryption',
                body: 'Keys are generated in your browser and exchanged when both users join. The server never sees plaintext.',
              },
              {
                title: 'Google-Meet style sessions',
                body: 'Create a session ID, copy a link, and invite one person. Sessions start when the second user joins.',
              },
              {
                title: 'Real-time by default',
                body: 'Socket-powered messaging, presence, and typing indicators for a crisp chat experience.',
              },
              {
                title: '5-minute timer',
                body: 'The timer starts when both users join. You’ll get a 1-minute warning before the session ends.',
              },
              {
                title: 'No message persistence',
                body: 'Session messages live only in memory and are wiped when the session ends — no recovery.',
              },
              {
                title: 'Mobile-ready UI',
                body: 'Touch-friendly controls, responsive layouts, and a chat experience tested across breakpoints.',
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.04 }}
                className="rounded-2xl border border-surface-border bg-surface-raised p-5"
              >
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-sm text-ink-muted mt-2 leading-relaxed">{f.body}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-6xl mx-auto px-4 pb-14 sm:pb-20">
          <div className="rounded-3xl border border-surface-border bg-surface-raised p-6 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-semibold">How it works</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { step: '1', title: 'Sign in', body: 'Enter your email to receive a secure magic link.' },
                { step: '2', title: 'Create a session', body: 'Generate a unique session link and share it.' },
                { step: '3', title: 'Chat securely', body: 'Join together, exchange keys, and chat until the timer ends.' },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-surface-border bg-surface p-5">
                  <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-semibold">
                    {s.step}
                  </div>
                  <div className="mt-3 font-semibold">{s.title}</div>
                  <div className="mt-1 text-sm text-ink-muted leading-relaxed">{s.body}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-ink-muted">
                Ready to try it? Create a session and invite one person.
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white font-medium h-10 px-4 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-border bg-surface-raised">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-ink-muted">
            © {new Date().getFullYear()} Kairos Chat
          </div>
          <div className="text-xs text-ink-faint">
            Built for short, private conversations.
          </div>
        </div>
      </footer>
    </div>
  )
}

