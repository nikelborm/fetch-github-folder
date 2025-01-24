/**
 * @module
 */

export {
  GitHubApiAuthRatelimitedError,
  GitHubApiAuthRatelimitedErrorClass,
  GitHubApiBadCredentialsError,
  GitHubApiBadCredentialsErrorClass,
  GitHubApiCommonErrors,
  GitHubApiGeneralServerError,
  GitHubApiGeneralServerErrorClass,
  GitHubApiGeneralUserError,
  GitHubApiGeneralUserErrorClass,
  GitHubApiNoCommitFoundForGitRefError,
  GitHubApiNoCommitFoundForGitRefErrorClass,
  GitHubApiRatelimitedError,
  GitHubApiRatelimitedErrorClass,
  GitHubApiRepoIsEmptyError,
  GitHubApiRepoIsEmptyErrorClass,
  GitHubApiThingNotExistsOrYouDontHaveAccessError,
  GitHubApiThingNotExistsOrYouDontHaveAccessErrorClass,
} from './src/commonErrors.js';
export * from './src/TaggedErrorVerifyingCause.js';
export {
  FailedToCastDataToReadableStreamError,
  FailedToCastDataToReadableStreamErrorClass,
} from './src/castToReadableStream.js';
export {
  FailedToParseGitLFSInfoError,
  FailedToParseGitLFSInfoErrorClass,
  FailedToParseResponseFromRepoPathContentsMetaInfoAPIError,
  FailedToParseResponseFromRepoPathContentsMetaInfoAPIErrorClass,
  InconsistentExpectedAndRealContentSizeError,
  InconsistentExpectedAndRealContentSizeErrorClass,
} from './src/getPathContents/index.js';
export {
  FailedToUnpackRepoFolderTarGzStreamToFsError,
  FailedToUnpackRepoFolderTarGzStreamToFsErrorClass,
} from './src/unpackRepoFolderTarGzStreamToFs.js';
export {
  FailedToWriteFileStreamToDestinationPathError,
  FailedToWriteFileStreamToDestinationPathErrorClass,
} from './src/writeFileStreamToDestinationPath.js';
