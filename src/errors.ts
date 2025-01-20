import { RequestError } from '@octokit/request-error';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';

export class GitHubApiGeneralServerError extends TaggedErrorVerifyingCause()(
  'GitHubApiGeneralServerError',
  'GitHub API Error: Bad server',
  RequestError,
) {}

export class GitHubApiGeneralUserError extends TaggedErrorVerifyingCause<{
  readonly notes?: string;
}>()(
  'GitHubApiGeneralUserError',
  'GitHub API Error: Bad user, invalid request',
  RequestError,
) {}

export class GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient extends TaggedErrorVerifyingCause()(
  'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient',
  "GitHub API Error: Either repo, owner, path in repo, or specified ref don't exist or you don't have permissions to access it",
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
  "GitHub API Error: Token you're using is invalid.",
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

export const parseCommonGitHubApiErrors = (error: RequestError) => {
  if (error.status === 401) return new GitHubApiBadCredentials(error);

  // https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api?apiVersion=2022-11-28#failed-login-limit
  if (error.status === 403) return new GitHubApiAuthRatelimited(error);

  // docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
  if (error.status === 429) return new GitHubApiRatelimited(error);

  if (error.status === 404)
    return new GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient(error);

  if (error.status >= 500) return new GitHubApiGeneralServerError(error);

  if (error.status >= 400) return new GitHubApiGeneralUserError(error, {});

  return error;
};

export type GitHubApiCommonErrors =
  | RequestError
  | GitHubApiGeneralServerError
  | GitHubApiGeneralUserError
  | GitHubApiBadCredentials
  | GitHubApiAuthRatelimited
  | GitHubApiRatelimited;
