import { copyJson, copyText, Executor } from '@qiwi/packasso'

export const executor: Executor = ({ cwd, res }) => {
  copyText(res, cwd, '.gitignore')
  copyJson(res, cwd, 'package.json')
}
