import { RequestError } from '@octokit/request-error';
import {
  TaggedErrorClassWithNoStaticContext,
  TaggedErrorClassWithNoContext,
  TaggedErrorVerifyingCause,
} from './TaggedErrorVerifyingCause.js';

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiGeneralServerErrorClass = TaggedErrorClassWithNoContext<
  'GitHubApiGeneralServerError',
  typeof RequestError
>;

export type GitHubApiGeneralServerError =
  InstanceType<GitHubApiGeneralServerErrorClass>;

export const GitHubApiGeneralServerError: GitHubApiGeneralServerErrorClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiGeneralServerError',
    'GitHub API Error: Bad server',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiGeneralUserErrorClass =
  TaggedErrorClassWithNoStaticContext<
    'GitHubApiGeneralUserError',
    typeof RequestError,
    { readonly notes?: string }
  >;

export type GitHubApiGeneralUserError =
  InstanceType<GitHubApiGeneralUserErrorClass>;

export const GitHubApiGeneralUserError: GitHubApiGeneralUserErrorClass =
  TaggedErrorVerifyingCause<{ readonly notes?: string }>()(
    'GitHubApiGeneralUserError',
    'GitHub API Error: Bad user, invalid request',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientErrorClass =
  TaggedErrorClassWithNoContext<
    'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientError',
    typeof RequestError
  >;

export type GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientError =
  InstanceType<GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientErrorClass>;

export const GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientError: GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientErrorClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientError',
    "GitHub API Error: Either repo, owner, path in repo, or specified ref don't exist or you don't have permissions to access it",
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiRepoIsEmptyErrorClass = TaggedErrorClassWithNoContext<
  'GitHubApiRepoIsEmptyError',
  typeof RequestError
>;

export type GitHubApiRepoIsEmptyError =
  InstanceType<GitHubApiRepoIsEmptyErrorClass>;

export const GitHubApiRepoIsEmptyError: GitHubApiRepoIsEmptyErrorClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiRepoIsEmptyError',
    'GitHub API Error: This Repo is empty',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiNoCommitFoundForGitRefErrorClass =
  TaggedErrorClassWithNoStaticContext<
    'GitHubApiNoCommitFoundForGitRefError',
    typeof RequestError,
    { gitRef: string }
  >;

export type GitHubApiNoCommitFoundForGitRefError =
  InstanceType<GitHubApiNoCommitFoundForGitRefErrorClass>;

export const GitHubApiNoCommitFoundForGitRefError: GitHubApiNoCommitFoundForGitRefErrorClass =
  TaggedErrorVerifyingCause<{ gitRef: string }>()(
    'GitHubApiNoCommitFoundForGitRefError',
    'GitHub API Error: No commit found for this git ref',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiBadCredentialsErrorClass = TaggedErrorClassWithNoContext<
  'GitHubApiBadCredentialsError',
  typeof RequestError
>;

export type GitHubApiBadCredentialsError =
  InstanceType<GitHubApiBadCredentialsErrorClass>;

export const GitHubApiBadCredentialsError: GitHubApiBadCredentialsErrorClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiBadCredentialsError',
    "GitHub API Error: Token you're using is invalid.",
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiAuthRatelimitedErrorClass = TaggedErrorClassWithNoContext<
  'GitHubApiAuthRatelimitedError',
  typeof RequestError
>;

export type GitHubApiAuthRatelimitedError =
  InstanceType<GitHubApiAuthRatelimitedErrorClass>;

export const GitHubApiAuthRatelimitedError: GitHubApiAuthRatelimitedErrorClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiAuthRatelimitedError',
    'GitHub API Error: Too many invalid auth attempts. Chillout pal',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiRatelimitedErrorClass = TaggedErrorClassWithNoContext<
  'GitHubApiRatelimitedError',
  typeof RequestError
>;

export type GitHubApiRatelimitedError =
  InstanceType<GitHubApiRatelimitedErrorClass>;

export const GitHubApiRatelimitedError: GitHubApiRatelimitedErrorClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiRatelimitedError',
    'GitHub API Error: Too many requests. Chillout pal',
    RequestError,
  );

export const parseCommonGitHubApiErrors = (error: RequestError) => {
  if (error.status === 401) return new GitHubApiBadCredentialsError(error);

  // https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api?apiVersion=2022-11-28#failed-login-limit
  if (error.status === 403) return new GitHubApiAuthRatelimitedError(error);

  // docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
  if (error.status === 429) return new GitHubApiRatelimitedError(error);

  if (error.status === 404)
    return new GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientError(
      error,
    );

  if (error.status >= 500) return new GitHubApiGeneralServerError(error);

  if (error.status >= 400) return new GitHubApiGeneralUserError(error, {});

  return error;
};

export type GitHubApiCommonErrors =
  | RequestError
  | GitHubApiGeneralServerError
  | GitHubApiGeneralUserError
  | GitHubApiBadCredentialsError
  | GitHubApiAuthRatelimitedError
  | GitHubApiRatelimitedError;
