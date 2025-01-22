import type { UnknownException } from 'effect/Cause';
import { type Effect, fail, gen } from 'effect/Effect';
import type { FailedToCastDataToReadableStream } from './castToReadableStream.js';
import type { InputConfig, OutputConfig } from './configContext.js';
import type {
  GitHubApiAuthRatelimited,
  GitHubApiBadCredentials,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRef,
  GitHubApiRatelimited,
  GitHubApiRepoIsEmpty,
  GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient,
} from './errors.js';
import {
  type FailedToParseResponseFromRepoPathContentsMetaInfoAPI,
  type InconsistentExpectedAndRealContentSize,
  PathContentsMetaInfo,
  RawStreamOfRepoPathContentsFromGitHubAPI,
} from './getPathContents/index.js';
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';
import {
  type FailedToUnpackRepoFolderTarGzStreamToFs,
  unpackRepoFolderTarGzStreamToFs,
} from './unpackRepoFolderTarGzStreamToFs.js';
import {
  type FailedToWriteFileStreamToDestinationPath,
  writeFileStreamToDestinationPath,
} from './writeFileStreamToDestinationPath.js';
import { Octokit } from '@octokit/core';

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const downloadEntityFromRepo: Effect<
  void,
  | Error
  | InconsistentExpectedAndRealContentSize
  | FailedToWriteFileStreamToDestinationPath
  | FailedToUnpackRepoFolderTarGzStreamToFs
  | UnknownException
  | GitHubApiRepoIsEmpty
  | GitHubApiNoCommitFoundForGitRef
  | GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient
  | GitHubApiBadCredentials
  | GitHubApiAuthRatelimited
  | GitHubApiRatelimited
  | GitHubApiGeneralServerError
  | GitHubApiGeneralUserError
  | FailedToParseResponseFromRepoPathContentsMetaInfoAPI
  | FailedToCastDataToReadableStream,
  OutputConfig | Octokit | InputConfig
> = gen(function* () {
  const pathContentsMetaInfo = yield* PathContentsMetaInfo;

  if (pathContentsMetaInfo.type === 'dir')
    return yield* unpackRepoFolderTarGzStreamToFs(
      getReadableTarGzStreamOfRepoDirectory(pathContentsMetaInfo.treeSha),
    );

  if (
    pathContentsMetaInfo.meta ===
    'This file is small enough that GitHub API decided to inline it'
  )
    return yield* writeFileStreamToDestinationPath(
      pathContentsMetaInfo.contentStream,
    );

  if (pathContentsMetaInfo.meta === 'This file can be downloaded as a blob')
    return yield* writeFileStreamToDestinationPath(
      RawStreamOfRepoPathContentsFromGitHubAPI,
    );

  yield* fail(new Error('LFS files are not yet supported'));
});
