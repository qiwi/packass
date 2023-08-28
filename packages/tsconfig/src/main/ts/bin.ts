#!/usr/bin/env node
import {
  createCommandInstall,
  createCommandPurge,
  getTypeScriptPaths,
  Install,
  program,
} from '@packasso/core'

const install: Install = {
  data: (pkg, topo) => [
    pkg.leaf || pkg.unit
      ? {
          'tsconfig.json': {
            compilerOptions: {
              module: 'es2022',
              target: 'es2022',
              moduleResolution: 'node',
              jsx: 'react-jsx',
              strict: true,
              skipLibCheck: true,
              esModuleInterop: true,
              experimentalDecorators: true,
              isolatedModules: true,
              resolveJsonModule: true,
              removeComments: true,
              importHelpers: false,
              baseUrl: './',
              types: ['node'],
              paths: getTypeScriptPaths(pkg, topo),
            },
            include: ['./src/main/ts'],
            exclude: ['./node_modules'],
          },
        }
      : {},
  ],
  deps: ['typescript'],
}

program(createCommandInstall(install), createCommandPurge(['tsconfig.json']))