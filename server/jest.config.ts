import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^../index$': '<rootDir>/src/index.ts',
    '^../db$': '<rootDir>/src/db/index.ts',
  },
}

export default config