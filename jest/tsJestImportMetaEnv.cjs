const tsJest = require('ts-jest')

function replaceImportMetaEnv(output) {
  if (typeof output === 'string') {
    return output.replaceAll('import.meta.env', 'process.env')
  }

  if (output && typeof output.code === 'string') {
    return { ...output, code: output.code.replaceAll('import.meta.env', 'process.env') }
  }

  return output
}

module.exports = {
  createTransformer(tsJestConfig) {
    const tsJestTransformer = tsJest.default.createTransformer(tsJestConfig)

    return {
      ...tsJestTransformer,
      process(src, filename, jestConfig, transformOptions) {
        return replaceImportMetaEnv(
          tsJestTransformer.process(src, filename, jestConfig, transformOptions),
        )
      },
    }
  },
}

