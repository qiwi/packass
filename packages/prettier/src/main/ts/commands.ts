import {
  cmd,
  Commands,
  ContextInstallData,
  execute,
  install,
  uninstall,
} from '@packasso/core'

const data: ContextInstallData = ({ pkg }) => [
  pkg.leaf || pkg.unit
    ? {
        '.prettierrc.json': '"prettier-config-qiwi"',
      }
    : {},
]

export const commands: Commands = {
  install: async (context) => {
    await install(context.pkg, ...data(context))
  },
  uninstall: async (context) => {
    await uninstall(context.pkg, ...data(context))
  },
  lint: async ({ pkg, pkgs, args }) => {
    await execute(
      cmd('prettier', {
        loglevel: 'warn',
        ...(args.fix ? { write: true } : { check: true }),
        _: pkg.tree ? pkgs.map(({ relPath }) => `${relPath}/src`) : ['src'],
      }),
      pkg,
    )
  },
  purge: async ({ pkg, pkgs }) => {
    await execute('rimraf .prettierrc .prettierrc.* prettier.config.*', [
      pkg,
      ...pkgs,
    ])
  },
}
