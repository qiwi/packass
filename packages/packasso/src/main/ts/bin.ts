#!/usr/bin/env node
import { createCommandModules, program } from '@packasso/core'

const BIN = '@packasso/bin'
const GIT_IGNORE = '@packasso/gitignore'
const LICENSE = '@packasso/license'
const YARN_AUDIT = '@packasso/yarn-audit'
const TSC = '@packasso/tsc'
const BUILD_STAMP = '@packasso/buildstamp'
const ESLINT = '@packasso/eslint'
const PRETTIER = '@packasso/prettier'
const UVU = '@packasso/uvu'
const SEMREL = '@packasso/semrel'

const modules: Record<string, string[]> = {
  install: [
    GIT_IGNORE,
    LICENSE,
    BIN,
    TSC,
    BUILD_STAMP,
    ESLINT,
    PRETTIER,
    SEMREL,
  ],
  uninstall: [
    SEMREL,
    PRETTIER,
    ESLINT,
    BUILD_STAMP,
    TSC,
    BIN,
    LICENSE,
    GIT_IGNORE,
  ],
  build: [BUILD_STAMP, TSC],
  lint: [ESLINT, PRETTIER],
  audit: [YARN_AUDIT],
  test: [UVU],
  release: [SEMREL],
  clean: [BUILD_STAMP, TSC, UVU],
  purge: [GIT_IGNORE, LICENSE, TSC, ESLINT, PRETTIER, UVU, SEMREL],
}

program(createCommandModules(modules))