import { extractSessionId } from '@/lib/sessionId'

describe('extractSessionId', () => {
  it('accepts bare IDs', () => {
    expect(extractSessionId('abc123')).toBe('abc123')
    expect(extractSessionId(' ABC123 ')).toBe('abc123')
  })

  it('accepts full session links', () => {
    expect(extractSessionId('http://localhost:5173/session/abc123')).toBe('abc123')
    expect(extractSessionId('https://yourapp.com/session/abc123?x=1')).toBe('abc123')
    expect(extractSessionId('/session/abc123')).toBe('abc123')
    expect(extractSessionId('https://yourapp.com/session/abc123/')).toBe('abc123')
  })

  it('rejects non-session links', () => {
    expect(extractSessionId('http://localhost:5173/verify#token=xyz')).toBeNull()
  })

  it('rejects invalid IDs', () => {
    expect(extractSessionId('abcd')).toBeNull()
    expect(extractSessionId('abcdefg')).toBeNull()
    expect(extractSessionId('abc12-')).toBeNull()
  })
})

