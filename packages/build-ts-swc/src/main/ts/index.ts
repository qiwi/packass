import {
  copyJson,
  copyText,
  Executor,
  getDependencies,
  getReferences,
  getWorkspaces,
} from '@packasso/core'

export const executor: Executor = ({ cwd, res, pkg }) => {
  const dependencies = pkg.workspaces
    ? getWorkspaces(cwd, pkg)
    : getDependencies(cwd, pkg)
  copyText(res, cwd, '.gitignore')
  copyJson(res, cwd, 'package.json')
  copyJson(res, cwd, 'swc.cjs.json')
  copyJson(res, cwd, 'swc.esm.json')
  copyJson(res, cwd, 'tsconfig.dts.json', {
    references: getReferences(cwd, dependencies, 'tsconfig.dts.json'),
  })
}
