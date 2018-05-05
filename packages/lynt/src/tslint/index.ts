import { Linter, Configuration } from 'tslint'
import globby from 'globby'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import getConfig from './config'
import { LyntOptions, LyntResults } from '../types'

/**
 * Lint files using TSLint. Optionally adds extra React rules if `react` flag is
 * passed.
 *
 * @param paths Glob patterns of files to lint.
 * @param options A configuration object that lets you customize how lynt works.
 * @return A `results` object with an errorCount and output.
 */
function tslint(paths: Array<string>, options: LyntOptions): LyntResults {
  if (!options.project && paths.length === 0) {
    options.project = '.'
  }

  const config = getConfig(options)
  const configPath = join(__dirname, 'tslint.json')

  writeFileSync(configPath, JSON.stringify(config, null, 2))

  const tslintConfig = Configuration.findConfiguration(configPath).results
  const tslintOptions = {
    fix: !!options.fix,
    formatter: options.json ? 'json' : 'stylish'
  }

  let linter: Linter
  let filesToLint: Array<string>

  if (options.project) {
    const tsconfig = join(options.project, 'tsconfig.json')

    if (!existsSync(tsconfig)) {
      throw new Error('No tsconfig.json file found in the project root.')
    }

    const program = Linter.createProgram(tsconfig, options.project)
    linter = new Linter(tslintOptions, program)
    filesToLint = Linter.getFileNames(program)
  } else {
    linter = new Linter(tslintOptions)
    filesToLint = globby.sync(paths)
  }

  filesToLint.forEach(file => {
    const fileContents = readFileSync(file, 'utf8')
    linter.lint(file, fileContents, tslintConfig)
  })

  unlinkSync(configPath)

  const { errorCount, output } = linter.getResult()

  const results: LyntResults = {
    errorCount,
    output
  }

  return results
}

export default tslint
