import { CLIEngine } from 'eslint'
import { getESLintOptions } from './config'
import convert from './convert'
import { Options, Results } from '../common/types'

/**
 * Lints files using ESLint.
 *
 * @param paths Glob patterns of files to lint.
 * @param options A configuration object that lets you customize how lynt works.
 * @return A `results` object with an errorCount and output.
 */
function eslint(paths: Array<string>, options: Options): Results {
  const eslintOptions = getESLintOptions(options)
  const engine = new CLIEngine(eslintOptions)

  let filesToLint = paths

  if (paths.length === 0) {
    filesToLint = options.react ? ['**/*.js', '**.jsx'] : ['**/*.js']
  }

  const report = engine.executeOnFiles(filesToLint)

  if (options.fix) {
    CLIEngine.outputFixes(report)
  }

  const results = convert(report.results)

  return results
}

export default eslint
