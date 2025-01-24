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
  GitHubApiThingNotExistsOrYouDontHaveAccessError,
} from './src/commonErrors.js';
export * from './src/TaggedErrorVerifyingCause.js';
export { FailedToCastDataToReadableStreamError } from './src/castToReadableStream.js';
export {
  FailedToParseGitLFSInfoError,
  FailedToParseResponseFromRepoPathContentsMetaInfoAPIError,
  InconsistentExpectedAndRealContentSizeError,
} from './src/getPathContents/index.js';
export { FailedToUnpackRepoFolderTarGzStreamToFsError } from './src/unpackRepoFolderTarGzStreamToFs.js';
export { FailedToWriteFileStreamToDestinationPathError } from './src/writeFileStreamToDestinationPath.js';
