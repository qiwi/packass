#!/usr/bin/env node
import {
  cmd,
  createCommand,
  createCommandClean,
  createCommandInstall,
  createCommandPurge,
  createOption,
  execute,
  getJestModuleNameMapper,
  getJestProjects,
  getNodeModules,
  getTopo,
  Install,
  program,
} from '@packasso/core'

const install: Install = {
  deps: ['@jest'],
  data: (pkg, topo) => [
    {
      'jest.config.json':
        pkg.leaf || pkg.unit
          ? {
              displayName: pkg.name,
              injectGlobals: false,
              clearMocks: true,
              resetMocks: true,
              testEnvironment: '@packasso/jest-environment-jsdom',
              testMatch: ['<rootDir>/src/test/[jt]s/**/*.[jt]s?(x)'],
              testPathIgnorePatterns: ['__mocks__', '__snapshots__'],
              collectCoverage: true,
              collectCoverageFrom: ['<rootDir>/src/main/[jt]s/**/*.[jt]s?(x)'],
              coverageDirectory: '<rootDir>/target/coverage',
              coveragePathIgnorePatterns: [
                '<rootDir>/node_modules',
                '<rootDir>/target',
              ],
              coverageProvider: 'v8',
              snapshotResolver: '@packasso/jest-snapshot-resolver',
              moduleNameMapper: getJestModuleNameMapper(pkg, topo),
              transform: {
                '^.+\\.svg$': '@packasso/jest-svgr-transformer',
                '^.+\\.[jt]sx?$': [
                  '@swc/jest',
                  {
                    jsc: {
                      transform: {
                        react: {
                          runtime: 'automatic',
                        },
                      },
                    },
                  },
                ],
              },
              transformIgnorePatterns: [],
            }
          : {
              collectCoverage: true,
              collectCoverageFrom: ['<rootDir>/src/main/[jt]s/**/*.[jt]s?(x)'],
              coverageDirectory: '<rootDir>/target/coverage',
              coveragePathIgnorePatterns: [
                '<rootDir>/node_modules',
                '<rootDir>/target',
              ],
              projects: getJestProjects(pkg, topo),
            },
    },
  ],
}

const createCommandTest = (name: string, description: string, suffix: string) =>
  createCommand(name, description)
    .addOption(createOption('-u', 'update snapshots and screenshots'))
    .action(async (options) => {
      const { cwd, preset, u } = options
      const { root } = await getTopo({ cwd }, preset)
      await execute(
        cmd(
          'jest',
          {
            silent: true,
            passWithNoTests: true,
            updateSnapshot: u,
            testMatch: [`'<rootDir>/src/test/[jt]s/**/*.${suffix}.[jt]s?(x)'`],
          },
          {
            NODE_PATH: getNodeModules(),
          },
        ),
        preset ? root.absPath : root,
      )
    })

program(
  createCommandInstall(install),
  createCommandClean(['target/coverage']),
  createCommandPurge(['coverage', 'jest.config.*', 'tsconfig.test.json']),
  createCommandTest('test:unit', 'unit tests', '(spec|test)'),
  createCommandTest('test:it', 'integration tests', 'it'),
  createCommandTest('test:e2e', 'end-to-end tests', 'e2e'),
)
