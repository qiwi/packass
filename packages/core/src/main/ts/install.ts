import { basename, dirname, relative, resolve } from 'node:path'

import fg from 'fast-glob'

import {
  applyJson,
  applyText,
  readJson,
  readText,
  revertJson,
  revertText,
  rmGlob,
} from './copy'
import { getModuleResourcesDir, loadModule } from './module'
import { ExtraPackageEntry, getExtraTopo, PackageType } from './topo'

interface InstallModuleResource {
  path: string
  data: string | object
}

interface InstallModuleResult {
  resources?: InstallModuleResource[]
  remove?: string[]
}

export interface InstallModule {
  (
    pkg: ExtraPackageEntry,
    root: string,
    source: boolean,
    uninstall: boolean,
  ): Promise<InstallModuleResult | void>
}

export const install: (
  root: string,
  source: boolean,
  uninstall?: boolean,
) => Promise<unknown> = async (root, source, uninstall = false) => {
  const topo = await getExtraTopo({
    cwd: root,
  })
  for (const name of topo.queue) {
    await installPackage(topo.packages[name], root, source, uninstall)
  }
  await installPackage(topo.root, root, source, uninstall)
}

export const installPackage = async (
  pkg: ExtraPackageEntry,
  root: string,
  source: boolean,
  uninstall: boolean,
) => {
  for (const module of pkg.modules) {
    await installModule(module, pkg, root, source, uninstall)
  }
}

const types: Record<PackageType, string[]> = {
  [PackageType.UNIT]: ['root', 'leaf', 'none'],
  [PackageType.TREE]: ['root', 'tree', 'none'],
  [PackageType.LEAF]: ['leaf', 'none'],
}

const special = (path: string) => {
  const name = basename(path)
  if (name === 'gitignore') {
    return resolve(dirname(path), `.${name}`)
  }
  return path
}

export const installModule = async (
  module: string,
  pkg: ExtraPackageEntry,
  root: string,
  source: boolean,
  uninstall: boolean,
) => {
  const { install } = await loadModule(module)
  const res = getModuleResourcesDir(module, root, source)
  let resources: InstallModuleResource[] = []
  types[pkg.type].forEach((type) => {
    const cwd = resolve(res, type)
    fg.sync('**/*', {
      cwd,
      dot: true,
      absolute: true,
      onlyFiles: true,
    }).forEach((path) => {
      resources.push({
        path: relative(cwd, special(path)),
        data: (path.endsWith('.json') ? readJson : readText)(path),
      })
    })
  })
  if (install) {
    const result = await install(pkg, root, source, uninstall)
    resources = [...resources, ...(result?.resources || [])]
    if (result?.remove) {
      result.remove.forEach((pattern) => {
        rmGlob(pkg.absPath, pattern)
      })
    }
  }
  installModuleResources(pkg, uninstall, resources)
}

const installModuleResources = (
  pkg: ExtraPackageEntry,
  uninstall: boolean,
  resources: InstallModuleResource[],
) => {
  resources.forEach(({ path, data }) => {
    const absPath = resolve(pkg.absPath, path)
    if (typeof data === 'string') {
      uninstall ? revertText(absPath, data) : applyText(absPath, data)
    } else {
      uninstall ? revertJson(absPath, data) : applyJson(absPath, data)
    }
  })
}
