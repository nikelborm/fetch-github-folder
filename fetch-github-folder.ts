#!/usr/bin/env node

import { Args } from '@effect/cli';
import {
  text,
  withDefault,
  withDescription,
  withFallbackConfig,
} from '@effect/cli/Args';
import { make, run } from '@effect/cli/Command';
import { layer as NodeFileSystemLayer } from '@effect/platform-node/NodeFileSystem';
import { layer as NodePathLayer } from '@effect/platform-node/NodePath';
import { runMain } from '@effect/platform-node/NodeRuntime';
import { layer as NodeTerminalLayer } from '@effect/platform-node/NodeTerminal';
import { Path } from '@effect/platform/Path';
import { Octokit as OctokitClient } from '@octokit/core';
import { ParseResult, Schema } from 'effect';
import { nonEmptyString } from 'effect/Config';
import { flatMap, provide, provideService } from 'effect/Effect';
import { pipe } from 'effect/Function';
import {
  downloadEntityFromRepo,
  OctokitTag,
  createSingleTargetConfigContext,
} from './src/index.js';

// Those values updated automatically. If you edit names of constants or
// move them to a different file, update ./scripts/build.sh
const PACKAGE_VERSION = '0.1.6';
const PACKAGE_NAME = 'fetch-github-folder';

const pathToDirectoryInRepo = pipe(
  text({ name: 'pathToDirectoryInRepo' }),
  withDescription('Path to directory in repo'),
  withFallbackConfig(nonEmptyString('PATH_TO_DIRECTORY_IN_REPO')),
);

const repoOwner = pipe(
  text({ name: 'repoOwner' }),
  withDescription("Repo owner's username"),
  withFallbackConfig(nonEmptyString('GITHUB_REPO_OWNER')),
);

const repoName = pipe(
  text({ name: 'repoName' }),
  withDescription("Repo's name"),
  withFallbackConfig(nonEmptyString('GITHUB_REPO_NAME')),
);

export const CleanedPathString = Schema.transformOrFail(
  Schema.String,
  Schema.String,
  {
    strict: true,
    decode: (dirtyPathToEntityInRepo, _, ast) =>
      Path.pipe(
        flatMap(path => {
          // dot can be there only when that's all there is. path.join(...)
          // removes all './', so '.' will never be just left by themself. If it's
          // there, it's very intentional and no other elements in the path exist.
          const cleanPathToEntityInRepo = path.join(
            dirtyPathToEntityInRepo,
          );

          if (cleanPathToEntityInRepo.startsWith('..'))
            return ParseResult.fail(
              new ParseResult.Type(
                ast,
                dirtyPathToEntityInRepo,
                "Can\'t request contents that lie higher than the root of the repo",
              ),
            );
          return ParseResult.succeed(cleanPathToEntityInRepo);
        }),
      ),
    encode: ParseResult.succeed,
  },
);

const localPathAtWhichEntityFromRepoWillBeAvailable = pipe(
  text({ name: 'destinationPath' }),
  withDescription(
    'Local path at which entity from repo will be available',
  ),
  withFallbackConfig(nonEmptyString('DESTINATION_PATH')),
  Args.withSchema(CleanedPathString),
  withDefault('./destination'),
);

const gitRef = pipe(
  text({ name: 'gitRef' }),
  withDescription('Commit sha hash or branch name or tag name'),
  withFallbackConfig(nonEmptyString('DESTINATION_PATH')),
  withDefault('HEAD'),
);

const appCommand = make(
  'fetch-github-folder',
  {
    repoOwner,
    repoName,
    pathToDirectoryInRepo,
    localPathAtWhichEntityFromRepoWillBeAvailable,
    gitRef,
  },
  x =>
    pipe(
      downloadEntityFromRepo,
      provide(
        createSingleTargetConfigContext({
          repo: {
            owner: x.repoOwner,
            name: x.repoName,
          },
          pathToEntityInRepo: x.pathToDirectoryInRepo,
          gitRef: x.gitRef,
          localPathAtWhichEntityFromRepoWillBeAvailable:
            x.localPathAtWhichEntityFromRepoWillBeAvailable,
        }),
      ),
    ),
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
  provideService(
    OctokitTag,
    new OctokitClient({
      // auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
    }),
  ),
  runMain,
);
