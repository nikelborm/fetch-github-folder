import { RequestError } from '@octokit/request-error';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';

export class GitHubApiGeneralServerError extends TaggedErrorVerifyingCause()(
  'GitHubApiGeneralServerError',
  'GitHub API Error: Bad server',
  RequestError,
) {}

export class GitHubApiGeneralUserError extends TaggedErrorVerifyingCause()(
  'GitHubApiGeneralUserError',
  'GitHub API Error: Bad user, invalid request',
  RequestError,
) {}

export class GitHubApiRepoDoesNotExistsOrPermissionsInsufficient extends TaggedErrorVerifyingCause()(
  'GitHubApiRepoDoesNotExistsOrPermissionsInsufficient',
  'GitHub API Error: Repo does not exists or you do not have permissions to access it',
  RequestError,
) {}

export class GitHubApiRepoIsEmpty extends TaggedErrorVerifyingCause()(
  'GitHubApiRepoIsEmpty',
  'GitHub API Error: This Repo is empty',
  RequestError,
) {}

export class GitHubApiNoCommitFoundForGitRef extends TaggedErrorVerifyingCause<{
  gitRef: string;
}>()(
  'GitHubApiNoCommitFoundForGitRef',
  'GitHub API Error: No commit found for this git ref',
  RequestError,
) {}

export class GitHubApiBadCredentials extends TaggedErrorVerifyingCause()(
  'GitHubApiBadCredentials',
  'GitHub API Error: Token you\'re using is invalid.',
  RequestError,
) {}

export class GitHubApiAuthRatelimited extends TaggedErrorVerifyingCause()(
  'GitHubApiAuthRatelimited',
  'GitHub API Error: Too many invalid auth attempts. Chillout pal',
  RequestError,
) {}

export class GitHubApiRatelimited extends TaggedErrorVerifyingCause()(
  'GitHubApiRatelimited',
  'GitHub API Error: Too many requests. Chillout pal',
  RequestError,
) {}

export type GitHubApiCommonErrors =
  | RequestError
  | GitHubApiGeneralServerError
  | GitHubApiGeneralUserError
  | GitHubApiBadCredentials
  | GitHubApiAuthRatelimited
  | GitHubApiRatelimited
