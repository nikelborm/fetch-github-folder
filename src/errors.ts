import { RequestError } from '@octokit/request-error';
import {
  ReturnTypeNoStatic,
  TaggedErrorVerifyingCause,
} from './TaggedErrorVerifyingCause.js';

// Extracted to a const to please JSR
const _Err1: ReturnTypeNoStatic<
  'GitHubApiGeneralServerError',
  typeof RequestError
> = TaggedErrorVerifyingCause()(
  'GitHubApiGeneralServerError',
  'GitHub API Error: Bad server',
  RequestError,
);

export class GitHubApiGeneralServerError extends _Err1 {}

// Extracted to a const to please JSR
const _Err2: ReturnTypeNoStatic<
  'GitHubApiGeneralUserError',
  typeof RequestError,
  { readonly notes?: string }
> = TaggedErrorVerifyingCause<{ readonly notes?: string }>()(
  'GitHubApiGeneralUserError',
  'GitHub API Error: Bad user, invalid request',
  RequestError,
);

export class GitHubApiGeneralUserError extends _Err2 {}

// Extracted to a const to please JSR
const _Err3: ReturnTypeNoStatic<
  'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient',
  typeof RequestError
> = TaggedErrorVerifyingCause()(
  'GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient',
  "GitHub API Error: Either repo, owner, path in repo, or specified ref don't exist or you don't have permissions to access it",
  RequestError,
);

export class GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient extends _Err3 {}

// Extracted to a const to please JSR
const _Err4: ReturnTypeNoStatic<'GitHubApiRepoIsEmpty', typeof RequestError> =
  TaggedErrorVerifyingCause()(
    'GitHubApiRepoIsEmpty',
    'GitHub API Error: This Repo is empty',
    RequestError,
  );

export class GitHubApiRepoIsEmpty extends _Err4 {}

// Extracted to a const to please JSR
const _Err5: ReturnTypeNoStatic<
  'GitHubApiNoCommitFoundForGitRef',
  typeof RequestError,
  { gitRef: string }
> = TaggedErrorVerifyingCause<{ gitRef: string }>()(
  'GitHubApiNoCommitFoundForGitRef',
  'GitHub API Error: No commit found for this git ref',
  RequestError,
);

export class GitHubApiNoCommitFoundForGitRef extends _Err5 {}

// Extracted to a const to please JSR
const _Err6: ReturnTypeNoStatic<
  'GitHubApiBadCredentials',
  typeof RequestError
> = TaggedErrorVerifyingCause()(
  'GitHubApiBadCredentials',
  "GitHub API Error: Token you're using is invalid.",
  RequestError,
);

export class GitHubApiBadCredentials extends _Err6 {}

// Extracted to a const to please JSR
const _Err7: ReturnTypeNoStatic<
  'GitHubApiAuthRatelimited',
  typeof RequestError
> = TaggedErrorVerifyingCause()(
  'GitHubApiAuthRatelimited',
  'GitHub API Error: Too many invalid auth attempts. Chillout pal',
  RequestError,
);

export class GitHubApiAuthRatelimited extends _Err7 {}

// Extracted to a const to please JSR
const _Err8: ReturnTypeNoStatic<'GitHubApiRatelimited', typeof RequestError> =
  TaggedErrorVerifyingCause()(
    'GitHubApiRatelimited',
    'GitHub API Error: Too many requests. Chillout pal',
    RequestError,
  );

export class GitHubApiRatelimited extends _Err8 {}

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
