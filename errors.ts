/**
 * @module
 */

export {
  GitHubApiAuthRatelimitedError,
  GitHubApiBadCredentialsError,
  GitHubApiCommonErrors,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRefError,
  GitHubApiRatelimitedError,
  GitHubApiRepoIsEmptyError,
  GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientError,
} from './src/errors.js';
export { FailedToCastDataToReadableStreamError } from './src/castToReadableStream.js';
export {
  FailedToParseGitLFSInfoError,
  InconsistentExpectedAndRealContentSizeError,
  FailedToParseResponseFromRepoPathContentsMetaInfoAPIError,
} from './src/getPathContents/index.js';
export { FailedToUnpackRepoFolderTarGzStreamToFs } from './src/unpackRepoFolderTarGzStreamToFs.js';
export { FailedToWriteFileStreamToDestinationPath } from './src/writeFileStreamToDestinationPath.js';
