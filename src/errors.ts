import type { RequestError } from '@octokit/request-error';

export class GitHubApiGeneralServerError extends Error {
  readonly _tag: string;

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Bad server')
    this._tag = this.constructor.name;
  }
}

export class GitHubApiGeneralUserError extends Error {
  readonly _tag: string;
  // don't try again
  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Bad user, invalid request')
    this._tag = this.constructor.name;
  }
}

export class GitHubApiRepoDoesNotExistsOrPermissionsInsufficient extends Error {
  readonly _tag: string;

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Repo does not exists or you do not have permissions to access it')
    this._tag = this.constructor.name;
  }
}

export class GitHubApiRepoIsEmpty extends Error {
  readonly _tag: string;

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: This Repo is empty')
    this._tag = this.constructor.name;
  }
}

export class GitHubApiBadCredentials extends Error {
  readonly _tag: string;

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Token you\'re using is invalid.')
    this._tag = this.constructor.name;
  }
}

export class GitHubApiAuthRatelimited extends Error {
  readonly _tag: string;

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Too many invalid auth attempts. Chillout pal')
    this._tag = this.constructor.name;
  }
}

export class GitHubApiRatelimited extends Error {
  readonly _tag: string;

  constructor(override readonly cause: RequestError) {
    super('GitHub API Error: Too many requests. Chillout pal')
    this._tag = this.constructor.name;
  }
}

export type GitHubApiCommonErrors = RequestError | GitHubApiGeneralServerError | GitHubApiGeneralUserError | GitHubApiBadCredentials | GitHubApiAuthRatelimited | GitHubApiRatelimited;
