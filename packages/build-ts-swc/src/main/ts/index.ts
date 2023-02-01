import { Executor } from '@packasso/core'

export const executor: Executor = async ({
  copyJson,
  dropPath,
  getReferences,
}) => {
  dropPath(['.swcrc', 'swc.{mjs,es5,es6}.json', 'tsconfig.build.json'])
  copyJson('package.json')
  copyJson('swc.cjs.json')
  copyJson('swc.esm.json')
  copyJson('tsconfig.dts.json', {
    references: getReferences('tsconfig.dts.json'),
  })
}
