import { RequestError } from "@octokit/request-error";
import type { OctokitResponse } from "@octokit/types";
import { pipe } from 'effect/Function';
import { UnknownException } from 'effect/Cause';
import { tryMapPromise } from 'effect/Effect';
import {
  GitHubApiAuthRatelimited,
  GitHubApiBadCredentials,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRef,
  GitHubApiRatelimited,
  GitHubApiRepoIsEmpty,
  GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient
} from '../errors.js';
import { OctokitTag } from '../octokit.js';
import { Repo } from '../repo.interface.js';

export const requestRepoPathContentsFromGitHubAPI = ({
  repo,
  gitRef,
  format,
  path,
  streamBody
}: {
  repo: Repo,
  path: string,
  format: 'object' | 'raw'
  gitRef?: string | undefined,
  streamBody?: boolean
}) => pipe(
  OctokitTag,
  tryMapPromise({
    try: (octokit, signal) => octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: repo.owner,
        repo: repo.name,
        path,
        ...(gitRef && { ref: gitRef }),
        request: {
          signal,
          parseSuccessResponseBody: !streamBody
        },
        mediaType: { format },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
      }
    ),
    catch: (error) => !(error instanceof RequestError)
      ? new UnknownException(error, "Failed to request contents at the path inside GitHub repo")
      : error.status === 404 && (error.response as ResponseWithError)?.data?.message === 'This repository is empty.'
      ? new GitHubApiRepoIsEmpty(error)
      : gitRef && error.status === 404 && (error.response as ResponseWithError)?.data?.message?.startsWith('No commit found for the ref')
      ? new GitHubApiNoCommitFoundForGitRef(error, { gitRef })
      // https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api?apiVersion=2022-11-28#failed-login-limit
      : error.status === 404
      ? new GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient(error)
      : error.status === 401
      ? new GitHubApiBadCredentials(error)
      : error.status === 403
      ? new GitHubApiAuthRatelimited(error)
      : error.status === 429
      ? new GitHubApiRatelimited(error)
      : error.status >= 500
      ? new GitHubApiGeneralServerError(error)
      : error.status >= 400
      ? new GitHubApiGeneralUserError(error)
      : error
  }),
)

type ResponseWithError = OctokitResponse<{ message?: string } | undefined, number>
