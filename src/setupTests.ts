import '@testing-library/jest-dom'

// react-router uses TextEncoder/TextDecoder in some environments; jest/jsdom may not provide them by default.
import { TextDecoder, TextEncoder } from 'util'

if (!globalThis.TextEncoder) {
  // @ts-expect-error - assign polyfill for test environment
  globalThis.TextEncoder = TextEncoder
}

if (!globalThis.TextDecoder) {
  // @ts-expect-error - assign polyfill for test environment
  globalThis.TextDecoder = TextDecoder
}

if (!globalThis.IntersectionObserver) {
  class IntersectionObserverMock implements IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}

    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  // @ts-expect-error - assign polyfill for test environment
  globalThis.IntersectionObserver = IntersectionObserverMock
}
