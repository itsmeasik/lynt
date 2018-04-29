import { CLIEngine } from 'eslint'
import { Linter as TSLinter, Configuration, ILinterOptions } from 'tslint'
import globby from 'globby'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getESLintConfig, getTSLintConfig } from './config'
import { LyntOptions, LyntResults } from './types'

class Linter {
  options: LyntOptions

  /**
   * Create a new Linter instance.
   *
   * @param options Settings for customizing lynt.
   */
  constructor(options: LyntOptions) {
    this.options = options
  }

  /**
   * Lint files using ESLint.
   *
   * @param paths Glob patterns of files to lint.
   * @return A results object with an errorCount and output.
   */
  eslint(paths: Array<string>): LyntResults {
    const config = getESLintConfig(this.options)
    const engine = new CLIEngine(config)
    const report = engine.executeOnFiles(paths)
    const format = this.options.json ? 'json' : 'stylish'
    const formatter = engine.getFormatter(format)
    const output = formatter(report.results)

    const results: LyntResults = {
      errorCount: report.errorCount,
      output
    }

    return results
  }

  /**
   * Lint files using TSLint.
   *
   * @param paths Glob patterns of files to lint.
   * @return A results object with an errorCount and output.
   */
  tslint(paths: Array<string>): LyntResults {
    if (paths.length === 0 && !this.options.project) {
      this.options.project = '.'
    }

    const configData = JSON.stringify(getTSLintConfig(this.options), null, 2)
    const configPath = join(__dirname, 'tslint.json')
    writeFileSync(configPath, configData)
    const configuration = Configuration.findConfiguration(configPath).results

    const options: ILinterOptions = {
      fix: false,
      formatter: this.options.json ? 'json' : 'stylish'
    }

    let linter: TSLinter
    let filesToLint: Array<string>

    if (this.options.project) {
      const program = TSLinter.createProgram('tsconfig.json', this.options.project)
      linter = new TSLinter(options, program)
      filesToLint = TSLinter.getFileNames(program)
    } else {
      linter = new TSLinter(options)
      filesToLint = globby.sync(paths)
    }

    filesToLint.forEach(file => {
      const fileContents = readFileSync(file, 'utf8')
      linter.lint(file, fileContents, configuration)
    })

    const { errorCount, output } = linter.getResult()

    const results: LyntResults = {
      errorCount,
      output
    }

    return results
  }

  /**
   * Lints files using TypeScript or ESLint based on the user's configured
   * options.
   *
   * @param paths Glob patterns of files to lint.
   * @return A results object with an errorCount and output.
   */
  lint(paths: Array<string>): LyntResults {
    if (this.options.typescript) {
      return this.tslint(paths)
    } else {
      return this.eslint(paths)
    }
  }
}

export default Linter
