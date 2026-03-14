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
