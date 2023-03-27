import { error } from 'node:console'
import { realpathSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { argv, execArgv, exit, cwd as pcwd } from 'node:process'

import { gitRoot } from '@antongolub/git-root'
import concurrently, { ConcurrentlyOptions } from 'concurrently'
import lodash from 'lodash'
import minimist, { ParsedArgs } from 'minimist'
import { readPackageUp } from 'read-pkg-up'

import { InstallData } from './install'
import { ExtraPackageEntry, ExtraTopoContext, getExtraTopo } from './topo'

export interface Context {
  cwd: string
  root: string
  development: boolean
  pkg: ExtraPackageEntry
  pkgs: ExtraPackageEntry[]
  topo: ExtraTopoContext
  module: Module
  command: string
  args: ParsedArgs
}

export type ContextInstallData = (context: Context) => InstallData

export const getModuleName = async (path: string = argv[1]) => {
  const res = await readPackageUp({ cwd: dirname(realpathSync(path)) })
  if (res) {
    return res.packageJson.name
  }
  throw new Error('Ooops...')
}

export const context: (module: Module) => Promise<Context> = async (module) => {
  const cwd = pcwd()
  const gitRootRes = await gitRoot(cwd)
  if (!gitRootRes) {
    throw new Error('can`t get git root')
  }
  const command = argv[2]
  if (command === undefined || command === '') {
    throw new Error('invalid command')
  }
  const root = gitRootRes.toString()
  const args = minimist(argv.slice(3))
  const { conditions } = minimist(execArgv)
  const development = [conditions].flat().includes('development')
  const topo = await getExtraTopo({ cwd: root })
  const pkg =
    Object.values(topo.packages).find(({ absPath }) => absPath === cwd) ||
    topo.root
  const pkgs =
    pkg === topo.root ? topo.queue.map((name) => topo.packages[name]) : []
  return {
    cwd,
    development,
    command,
    args,
    pkg,
    pkgs,
    topo,
    root,
    module,
  }
}

export const execute: (
  commands: string | string[],
  packages: ExtraPackageEntry | ExtraPackageEntry[],
  options?: Partial<ConcurrentlyOptions>,
) => Promise<unknown> = async (commands, packages, options) => {
  try {
    await concurrently(
      [commands].flat().flatMap((command) =>
        [packages].flat().flatMap(({ name, absPath: cwd }) => ({
          command,
          name,
          cwd,
        })),
      ),
      {
        prefixColors: ['auto'],
        ...options,
      },
    ).result
  } catch {
    throw new Error('ooops...')
  }
}

export const bin: (
  pkg: ExtraPackageEntry,
  root: string,
  module: string,
  development: boolean,
) => string = (pkg, root, module, development) =>
  development
    ? `npm_config_yes=true npx tsx --conditions development ${relative(
        pkg.absPath,
        realpathSync(
          resolve(root, 'node_modules', module, 'src', 'main', 'ts', 'bin.ts'),
        ),
      )}`
    : `npm_config_yes=true npx ${module}`

export const cmd: (bin: string, args: Partial<ParsedArgs>) => string = (
  bin,
  args,
) =>
  [
    bin,
    ...Object.entries(args).flatMap(([key, value]) => {
      if (lodash.isNil(value)) {
        return []
      }
      if (key === '_') {
        return value
      }
      const arg = [key.length === 1 ? '-' : '--', key].join('')
      if (value === true) {
        return arg
      }
      return [value].flat().flatMap((value) => [arg, value])
    }),
  ].join(' ')

export const npx: (
  pkg: ExtraPackageEntry,
  root: string,
  module: string,
  command: string,
  args: ParsedArgs,
  development: boolean,
  options?: Partial<ConcurrentlyOptions>,
) => Promise<unknown> = async (
  pkg,
  root,
  module,
  command,
  args,
  development,
  options,
) =>
  await execute(
    cmd(`${bin(pkg, root, module, development)} ${command}`, args),
    pkg,
    options,
  )

export type Command = (context: Context) => Promise<unknown>

export type Commands = Record<string, Command>

export type Module = {
  name: string
  commands: Commands
  modules: string[]
}

export const runWithContext: (context: Context) => Promise<unknown> = async (
  context,
) => {
  const { command, module } = context
  const { modules = [], commands = {} } = module
  for (const module of modules) {
    await runWithContext({
      ...context,
      module: {
        name: module,
        ...(await import(module)),
      },
    })
  }
  if (commands[command]) {
    await commands[command](context)
  }
}

export const runWithoutContext: (
  module?: Partial<Module>,
) => Promise<unknown> = async ({ commands = {}, modules = [] } = {}) => {
  await runWithContext(
    await context({
      name: await getModuleName(),
      modules,
      commands,
    }),
  )
}

export const run: (module?: Partial<Module>) => void = (module) => {
  runWithoutContext(module)
    .then(() => {
      exit(0)
    })
    .catch((e) => {
      error(e)
      exit(1)
    })
}
