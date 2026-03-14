import { useEffect, useMemo, useState } from 'react'

const pad2 = (value: number) => String(value).padStart(2, '0')

export const SessionTimer = ({
  startedAt,
  durationSec = 5 * 60,
  onExpire,
}: {
  startedAt: number
  durationSec?: number
  onExpire: () => void
}) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  const endAtMs = startedAt + durationSec * 1000
  const remainingMs = Math.max(0, endAtMs - now)
  const remainingSec = Math.ceil(remainingMs / 1000)

  useEffect(() => {
    if (remainingSec !== 0) return
    onExpire()
  }, [remainingSec, onExpire])

  const mm = useMemo(() => Math.floor(remainingSec / 60), [remainingSec])
  const ss = useMemo(() => remainingSec % 60, [remainingSec])
  const isWarning = remainingSec > 0 && remainingSec <= 60

  return (
    <div className="rounded-xl border border-surface-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-ink-muted">Session timer</div>
        <div className="text-sm font-semibold tabular-nums">
          {pad2(mm)}:{pad2(ss)}
        </div>
      </div>
      {isWarning && (
        <div className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
          1 minute remaining.
        </div>
      )}
    </div>
  )
}

