import type { RequestError } from '@octokit/request-error';

export class GitHubApiGeneralServerError extends Error {
  readonly _tag = 'GitHubApiGeneralServerError';

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Bad server')
  }
}

export class GitHubApiGeneralUserError extends Error {
  readonly _tag = 'GitHubApiGeneralUserError';
  // don't try again
  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Bad user, invalid request')
  }
}

export class GitHubApiRepoDoesNotExistsOrPermissionsInsufficient extends Error {
  readonly _tag = 'GitHubApiRepoDoesNotExistsOrPermissionsInsufficient';

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Repo does not exists or you do not have permissions to access it')
  }
}

export class GitHubApiRepoIsEmpty extends Error {
  readonly _tag = 'GitHubApiRepoIsEmpty';

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: This Repo is empty')
  }
}

export class GitHubApiBadCredentials extends Error {
  readonly _tag = 'GitHubApiBadCredentials';

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Token you\'re using is invalid.')
  }
}

export class GitHubApiAuthRatelimited extends Error {
  readonly _tag = 'GitHubApiAuthRatelimited'

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Too many invalid auth attempts. Chillout pal')
  }
}

export class GitHubApiRatelimited extends Error {
  readonly _tag = 'GitHubApiRatelimited'

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Too many requests. Chillout pal')
  }
}

export type GitHubApiCommonErrors = RequestError | GitHubApiGeneralServerError | GitHubApiGeneralUserError | GitHubApiBadCredentials | GitHubApiAuthRatelimited | GitHubApiRatelimited;
