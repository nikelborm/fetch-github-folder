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
export type GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientClass =
  TaggedErrorClassWithNoContext<
    'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient',
    typeof RequestError
  >;

export type GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient =
  InstanceType<GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientClass>;

export const GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient: GitHubApiSomethingDoesNotExistsOrPermissionsInsufficientClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient',
    "GitHub API Error: Either repo, owner, path in repo, or specified ref don't exist or you don't have permissions to access it",
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiRepoIsEmptyClass = TaggedErrorClassWithNoContext<
  'GitHubApiRepoIsEmpty',
  typeof RequestError
>;

export type GitHubApiRepoIsEmpty = InstanceType<GitHubApiRepoIsEmptyClass>;

export const GitHubApiRepoIsEmpty: GitHubApiRepoIsEmptyClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiRepoIsEmpty',
    'GitHub API Error: This Repo is empty',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiNoCommitFoundForGitRefClass =
  TaggedErrorClassWithNoStaticContext<
    'GitHubApiNoCommitFoundForGitRef',
    typeof RequestError,
    { gitRef: string }
  >;

export type GitHubApiNoCommitFoundForGitRef =
  InstanceType<GitHubApiNoCommitFoundForGitRefClass>;

export const GitHubApiNoCommitFoundForGitRef: GitHubApiNoCommitFoundForGitRefClass =
  TaggedErrorVerifyingCause<{ gitRef: string }>()(
    'GitHubApiNoCommitFoundForGitRef',
    'GitHub API Error: No commit found for this git ref',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiBadCredentialsClass = TaggedErrorClassWithNoContext<
  'GitHubApiBadCredentials',
  typeof RequestError
>;

export type GitHubApiBadCredentials =
  InstanceType<GitHubApiBadCredentialsClass>;

export const GitHubApiBadCredentials: GitHubApiBadCredentialsClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiBadCredentials',
    "GitHub API Error: Token you're using is invalid.",
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiAuthRatelimitedClass = TaggedErrorClassWithNoContext<
  'GitHubApiAuthRatelimited',
  typeof RequestError
>;

export type GitHubApiAuthRatelimited =
  InstanceType<GitHubApiAuthRatelimitedClass>;

export const GitHubApiAuthRatelimited: GitHubApiAuthRatelimitedClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiAuthRatelimited',
    'GitHub API Error: Too many invalid auth attempts. Chillout pal',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiRatelimitedClass = TaggedErrorClassWithNoContext<
  'GitHubApiRatelimited',
  typeof RequestError
>;

export type GitHubApiRatelimited = InstanceType<GitHubApiRatelimitedClass>;

export const GitHubApiRatelimited: GitHubApiRatelimitedClass =
  TaggedErrorVerifyingCause()(
    'GitHubApiRatelimited',
    'GitHub API Error: Too many requests. Chillout pal',
    RequestError,
  );

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
