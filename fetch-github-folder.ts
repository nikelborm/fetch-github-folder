#!/usr/bin/env node

import { make, run } from '@effect/cli/Command';
import {
  text,
  withDefault,
  withDescription,
  withFallbackConfig,
  withSchema,
} from '@effect/cli/Options';
import { layer as NodeFileSystemLayer } from '@effect/platform-node/NodeFileSystem';
import { layer as NodePathLayer } from '@effect/platform-node/NodePath';
import { runMain } from '@effect/platform-node/NodeRuntime';
import { layer as NodeTerminalLayer } from '@effect/platform-node/NodeTerminal';
import { Path } from '@effect/platform/Path';
import { Octokit as OctokitClient } from '@octokit/core';
// import { ParseResult, Schema } from 'effect';
import { nonEmptyString } from 'effect/Config';
import { flatMap, provide, provideService } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { Type, fail, succeed } from 'effect/ParseResult';
import { NonEmptyString, filter, transformOrFail } from 'effect/Schema';
import { outdent } from 'outdent';
import {
  OctokitTag,
  createSingleTargetConfigContext,
  downloadEntityFromRepo,
} from './src/index.js';

// Those values updated automatically. If you edit names of constants or
// move them to a different file, update ./scripts/build.sh
const PACKAGE_VERSION = '0.1.6';
const PACKAGE_NAME = 'fetch-github-folder';

// TODO: add support for effect CLI, to properly render what env vars can be used as fallback and also what default values are.

const GitHubStringHandle = NonEmptyString.pipe(
  filter(
    s =>
      s.match(/^[a-z0-9.\-_]+$/gi) ||
      `GitHub handle "${s}" should have only ASCII letters, digits, and the characters ".", "-", and "_"`,
  ),
);

const pathToEntityInRepo = pipe(
  text('pathToEntityInRepo'),
  withDescription('Path to file or directory in repo'),
  withFallbackConfig(nonEmptyString('PATH_TO_ENTITY_IN_REPO')),
);

const repoOwner = pipe(
  text('repoOwner'),
  withDescription(outdent`
    This is a username (login handle) of a person owning repo you
    are trying to download from. For example, if the repository's URL is
    \`https://github.com/apache/superset\`, the owner is \`apache\`
  `),
  withSchema(GitHubStringHandle),
  withFallbackConfig(nonEmptyString('GITHUB_REPO_OWNER')),
);

const repoName = pipe(
  text('repoName'),
  withDescription(outdent`
    This is the name handle of the repository you are trying to download
    from. For example, if the repository's URL is
    \`https://github.com/apache/superset\`, the name is \`superset\`
  `),
  withSchema(GitHubStringHandle),
  withFallbackConfig(nonEmptyString('GITHUB_REPO_NAME')),
);

export const CleanedPathString = transformOrFail(
  NonEmptyString,
  NonEmptyString,
  {
    strict: true,
    decode: (dirtyPathToEntityInRepo, _, ast) =>
      flatMap(Path, path => {
        // dot can be there only when that's all there is. path.join(...)
        // removes all './', so '.' will never be just left by themself. If it's
        // there, it's very intentional and no other elements in the path exist.
        const cleanPathToEntityInRepo = path.join(dirtyPathToEntityInRepo);

        if (cleanPathToEntityInRepo.startsWith('..'))
          return fail(
            new Type(
              ast,
              dirtyPathToEntityInRepo,
              "Can\'t request contents that lie higher than the root of the repo",
            ),
          );
        return succeed(cleanPathToEntityInRepo);
      }),
    encode: succeed,
  },
);

const localPathAtWhichEntityFromRepoWillBeAvailable = pipe(
  text('destinationPath'),
  withDescription(outdent`
    Local path of the downloaded file or directory. If
    "pathToEntityInRepo" points to a file, then last element of the
    destination path will be new file name. If "pathToEntityInRepo" points
    to a directory then all files and directories inside directory at
    "pathToEntityInRepo" will be put into a directory with name equal last
    element of destination path. If the directory doesn't exist, it will
    be automatically created.
  `),
  withFallbackConfig(nonEmptyString('DESTINATION_PATH')),
  withSchema(CleanedPathString),
  withDefault('./destination'),
);

const gitRef = pipe(
  text('gitRef'),
  withDescription(outdent`
    This is the commit's SHA hash, branch name, tag name, or any other ref
    you want to download from. If you don't specify it, the default branch
    in the repository will be used.
  `),
  withFallbackConfig(nonEmptyString('GIT_REF')),
  withDefault('HEAD'),
);

const appCommand = make(
  'fetch-github-folder',
  {
    repo: {
      owner: repoOwner,
      name: repoName,
    },
    pathToEntityInRepo,
    localPathAtWhichEntityFromRepoWillBeAvailable,
    gitRef,
  },
  x => provide(downloadEntityFromRepo, createSingleTargetConfigContext(x)),
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
