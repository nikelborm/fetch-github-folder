#!/usr/bin/env node

import { make, run } from '@effect/cli/Command';
import {
  text,
  withFallbackConfig,
  withDescription as withOptionDescription,
  withSchema,
} from '@effect/cli/Options';
import { layer as NodeFileSystemLayer } from '@effect/platform-node/NodeFileSystem';
import { layer as NodePathLayer } from '@effect/platform-node/NodePath';
import { runMain } from '@effect/platform-node/NodeRuntime';
import { layer as NodeTerminalLayer } from '@effect/platform-node/NodeTerminal';
import { Path } from '@effect/platform/Path';
import { Octokit as OctokitClient } from '@octokit/core';
import {
  all as allConfig,
  nonEmptyString as nonEmptyStringConfig,
  validate as validateConfig,
  withDefault as withConfigDefault,
  withDescription as withConfigDescription,
} from 'effect/Config';
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

const validateGitHubHandle = (s: string) => !!s.match(/^[a-z0-9.\-_]+$/gi);
const badGitHubHandleMessage = `GitHub handle should have only ASCII letters, digits, and the characters ".", "-", and "_"`;

const GitHubStringHandleSchema = NonEmptyString.pipe(
  filter(s => validateGitHubHandle(s) || badGitHubHandleMessage),
);

const withGitHubHandleConfigValidation = validateConfig({
  message: badGitHubHandleMessage,
  validation: validateGitHubHandle,
});

const pathToEntityInRepoDescription = 'Path to file or directory in repo';
const repoOwnerDescription = outdent`
  This is a username (login handle) of a person owning repo you
  are trying to download from. For example, if the repository's URL is
  \`https://github.com/apache/superset\`, the owner is \`apache\`
`;
const repoNameDescription = outdent`
  This is the name handle of the repository you are trying to download
  from. For example, if the repository's URL is
  \`https://github.com/apache/superset\`, the name is \`superset\`
`;
const destinationPathDescription = outdent`
  Local path of the downloaded file or directory. If
  "pathToEntityInRepo" points to a file, then last element of the
  destination path will be new file name. If "pathToEntityInRepo" points
  to a directory then all files and directories inside directory at
  "pathToEntityInRepo" will be put into a directory with name equal last
  element of destination path. If the directory doesn't exist, it will
  be automatically created.
`;
const gitRefDescription = outdent`
  This is the commit's SHA hash, branch name, tag name, or any other ref
  you want to download from. If you don't specify it, the default branch
  in the repository will be used.
`;

export const RepoNameConfig = pipe(
  nonEmptyStringConfig('GITHUB_REPO_NAME'),
  withGitHubHandleConfigValidation,
  withConfigDescription(repoNameDescription),
);

export const RepoOwnerConfig = pipe(
  nonEmptyStringConfig('GITHUB_REPO_OWNER'),
  withGitHubHandleConfigValidation,
  withConfigDescription(repoOwnerDescription),
);

export const DestinationPathConfig = pipe(
  nonEmptyStringConfig('DESTINATION_PATH'),
  withConfigDefault('./destination'),
  withConfigDescription(destinationPathDescription),
);

export const PathToEntityInRepoConfig = pipe(
  nonEmptyStringConfig('PATH_TO_ENTITY_IN_REPO'),
  withConfigDefault('.'),
  withConfigDescription(pathToEntityInRepoDescription),
);

export const GitRefConfig = pipe(
  nonEmptyStringConfig('GIT_REF'),
  withConfigDefault('HEAD'),
  withConfigDescription(gitRefDescription),
);

const RepoConfig = allConfig([RepoNameConfig, RepoOwnerConfig]);

export const SingleDownloadTargetConfig = allConfig([
  RepoConfig,
  PathToEntityInRepoConfig,
  DestinationPathConfig,
  GitRefConfig,
]);

export const CleanRepoEntityPathString = transformOrFail(
  NonEmptyString,
  NonEmptyString,
  {
    strict: true,
    decode: (dirtyPathToEntityInRepo, _, ast) =>
      flatMap(Path, path => {
        // dot can be there only when that's all there is. path.join(...)
        // removes all './', so '.' will never be just left by themself. If it's
        // there, it's very intentional and no other elements in the path exist.
        const cleanPathToEntityInRepo = path
          .join(dirtyPathToEntityInRepo)
          .replaceAll(/\/*$/g, '');

        if (cleanPathToEntityInRepo.startsWith('..'))
          return fail(
            new Type(
              ast,
              dirtyPathToEntityInRepo,
              "Can't request contents that lie higher than the root of the repo",
            ),
          );
        return succeed(cleanPathToEntityInRepo);
      }),
    encode: succeed,
  },
);

const pathToEntityInRepoCLIOption = pipe(
  text('pathToEntityInRepo'),
  withOptionDescription(pathToEntityInRepoDescription),
  withFallbackConfig(PathToEntityInRepoConfig),
  withSchema(CleanRepoEntityPathString),
);

const repoOwnerCLIOption = pipe(
  text('repoOwner'),
  withOptionDescription(repoOwnerDescription),
  withFallbackConfig(RepoOwnerConfig),
  withSchema(GitHubStringHandleSchema),
);

const repoNameCLIOption = pipe(
  text('repoName'),
  withOptionDescription(repoNameDescription),
  withFallbackConfig(RepoNameConfig),
  withSchema(GitHubStringHandleSchema),
);

const destinationPathCLIOption = pipe(
  text('destinationPath'),
  withOptionDescription(destinationPathDescription),
  withFallbackConfig(DestinationPathConfig),
);

const gitRefCLIOption = pipe(
  text('gitRef'),
  withOptionDescription(gitRefDescription),
  withFallbackConfig(GitRefConfig),
);

const appCommand = make(
  'fetch-github-folder',
  {
    repo: {
      owner: repoOwnerCLIOption,
      name: repoNameCLIOption,
    },
    pathToEntityInRepo: pathToEntityInRepoCLIOption,
    localPathAtWhichEntityFromRepoWillBeAvailable:
      destinationPathCLIOption,
    gitRef: gitRefCLIOption,
  },
  singleDownloadTargetConfig =>
    provide(
      downloadEntityFromRepo,
      createSingleTargetConfigContext(singleDownloadTargetConfig),
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
