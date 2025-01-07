import { RequestError } from '@octokit/request-error';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';

export class GitHubApiGeneralServerError extends TaggedErrorVerifyingCause(
  'GitHubApiGeneralServerError',
  RequestError,
  'GitHub API Error: Bad server'
) {}

export class GitHubApiGeneralUserError extends TaggedErrorVerifyingCause(
  'GitHubApiGeneralUserError',
  RequestError,
  'GitHub API Error: Bad user, invalid request'
) {}

export class GitHubApiRepoDoesNotExistsOrPermissionsInsufficient extends TaggedErrorVerifyingCause(
  'GitHubApiRepoDoesNotExistsOrPermissionsInsufficient',
  RequestError,
  'GitHub API Error: Repo does not exists or you do not have permissions to access it'
) {}

export class GitHubApiRepoIsEmpty extends TaggedErrorVerifyingCause(
  'GitHubApiRepoIsEmpty',
  RequestError,
  'GitHub API Error: This Repo is empty'
) {}

export class GitHubApiBadCredentials extends TaggedErrorVerifyingCause(
  'GitHubApiBadCredentials',
  RequestError,
  'GitHub API Error: Token you\'re using is invalid.'
) {}

export class GitHubApiAuthRatelimited extends TaggedErrorVerifyingCause(
  'GitHubApiAuthRatelimited',
  RequestError,
  'GitHub API Error: Too many invalid auth attempts. Chillout pal'
) {}

export class GitHubApiRatelimited extends TaggedErrorVerifyingCause(
  'GitHubApiRatelimited',
  RequestError,
  'GitHub API Error: Too many requests. Chillout pal'
) {}

export type GitHubApiCommonErrors =
  | RequestError
  | GitHubApiGeneralServerError
  | GitHubApiGeneralUserError
  | GitHubApiBadCredentials
  | GitHubApiAuthRatelimited
  | GitHubApiRatelimited
