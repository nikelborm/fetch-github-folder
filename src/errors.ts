import { RequestError } from '@octokit/request-error';
import {
  ReturnTypeNoStatic,
  TaggedErrorVerifyingCause,
} from './TaggedErrorVerifyingCause.js';

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiGeneralServerError = ReturnTypeNoStatic<
  'GitHubApiGeneralServerError',
  typeof RequestError
>;

export const GitHubApiGeneralServerError: GitHubApiGeneralServerError =
  TaggedErrorVerifyingCause()(
    'GitHubApiGeneralServerError',
    'GitHub API Error: Bad server',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiGeneralUserError = ReturnTypeNoStatic<
  'GitHubApiGeneralUserError',
  typeof RequestError,
  { readonly notes?: string }
>;

export const GitHubApiGeneralUserError: GitHubApiGeneralUserError =
  TaggedErrorVerifyingCause<{ readonly notes?: string }>()(
    'GitHubApiGeneralUserError',
    'GitHub API Error: Bad user, invalid request',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient =
  ReturnTypeNoStatic<
    'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient',
    typeof RequestError
  >;

export const GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient: GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient =
  TaggedErrorVerifyingCause()(
    'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient',
    "GitHub API Error: Either repo, owner, path in repo, or specified ref don't exist or you don't have permissions to access it",
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiRepoIsEmpty = ReturnTypeNoStatic<
  'GitHubApiRepoIsEmpty',
  typeof RequestError
>;

export const GitHubApiRepoIsEmpty: GitHubApiRepoIsEmpty =
  TaggedErrorVerifyingCause()(
    'GitHubApiRepoIsEmpty',
    'GitHub API Error: This Repo is empty',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiNoCommitFoundForGitRef = ReturnTypeNoStatic<
  'GitHubApiNoCommitFoundForGitRef',
  typeof RequestError,
  { gitRef: string }
>;

export const GitHubApiNoCommitFoundForGitRef: GitHubApiNoCommitFoundForGitRef =
  TaggedErrorVerifyingCause<{ gitRef: string }>()(
    'GitHubApiNoCommitFoundForGitRef',
    'GitHub API Error: No commit found for this git ref',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiBadCredentials = ReturnTypeNoStatic<
  'GitHubApiBadCredentials',
  typeof RequestError
>;

export const GitHubApiBadCredentials: GitHubApiBadCredentials =
  TaggedErrorVerifyingCause()(
    'GitHubApiBadCredentials',
    "GitHub API Error: Token you're using is invalid.",
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiAuthRatelimited = ReturnTypeNoStatic<
  'GitHubApiAuthRatelimited',
  typeof RequestError
>;

export const GitHubApiAuthRatelimited: GitHubApiAuthRatelimited =
  TaggedErrorVerifyingCause()(
    'GitHubApiAuthRatelimited',
    'GitHub API Error: Too many invalid auth attempts. Chillout pal',
    RequestError,
  );

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type GitHubApiRatelimited = ReturnTypeNoStatic<
  'GitHubApiRatelimited',
  typeof RequestError
>;

export const GitHubApiRatelimited: GitHubApiRatelimited =
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
