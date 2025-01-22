/**
 * @module
 */

export {
  GitHubApiAuthRatelimited,
  GitHubApiBadCredentials,
  GitHubApiCommonErrors,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRef,
  GitHubApiRatelimited,
  GitHubApiRepoIsEmpty,
  GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient,
} from './src/errors.js';
export { FailedToCastDataToReadableStream } from './src/castToReadableStream.js';
export {
  FailedToParseGitLFSInfo,
  InconsistentExpectedAndRealContentSize,
  FailedToParseResponseFromRepoPathContentsMetaInfoAPI,
} from './src/getPathContents/index.js';
export { FailedToUnpackRepoFolderTarGzStreamToFs } from './src/unpackRepoFolderTarGzStreamToFs.js';
export { FailedToWriteFileStreamToDestinationPath } from './src/writeFileStreamToDestinationPath.js';
