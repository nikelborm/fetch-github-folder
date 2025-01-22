#!/usr/bin/env node

import { make, run } from '@effect/cli/Command';
import { layer as NodeFileSystemLayer } from '@effect/platform-node-shared/NodeFileSystem';
import { layer as NodePathLayer } from '@effect/platform-node-shared/NodePath';
import { layer as NodeTerminalLayer } from '@effect/platform-node-shared/NodeTerminal';
import { runMain } from '@effect/platform-node-shared/NodeRuntime';
import { provide } from 'effect/Effect';
import { pipe } from 'effect/Function';
import {
  destinationPathCLIOptionBackedByEnv,
  downloadEntityFromRepo,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
  pathToEntityInRepoCLIOptionBackedByEnv,
  provideSingleDownloadTargetConfig,
  repoNameCLIOptionBackedByEnv,
  repoOwnerCLIOptionBackedByEnv,
} from './src/index.js';
import { CliConfig } from '@effect/cli';

// Those values updated automatically. If you edit names of constants or
// move them to a different file, update ./scripts/build.sh
const PACKAGE_VERSION = '0.1.12';
const PACKAGE_NAME = 'fetch-github-folder';

const appCommand = make(
  'fetch-github-folder',
  {
    repo: {
      owner: repoOwnerCLIOptionBackedByEnv,
      name: repoNameCLIOptionBackedByEnv,
    },
    pathToEntityInRepo: pathToEntityInRepoCLIOptionBackedByEnv,
    localPathAtWhichEntityFromRepoWillBeAvailable:
      destinationPathCLIOptionBackedByEnv,
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  config =>
    downloadEntityFromRepo.pipe(provideSingleDownloadTargetConfig(config)),
);

const cli = run(appCommand, {
  // those values will be filled automatically from package.json
  name: PACKAGE_NAME,
  version: PACKAGE_VERSION,
});

pipe(
  process.argv,
  cli,
  provide(NodeFileSystemLayer),
  provide(NodePathLayer),
  provide(NodeTerminalLayer),
  provide(CliConfig.layer({ showTypes: false })),
  provide(
    OctokitLayer({
      // auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
    }),
  ),
  runMain,
);
