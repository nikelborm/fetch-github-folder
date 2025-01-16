import { RequestError } from '@octokit/request-error';
import type { OctokitResponse } from '@octokit/types';
import { UnknownException } from 'effect/Cause';
import { gen, tryPromise } from 'effect/Effect';
import { InputConfigTag, RepoConfigTag } from '../config.js';
import {
  GitHubApiNoCommitFoundForGitRef,
  GitHubApiRepoIsEmpty,
  GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient,
  parseCommonGitHubApiErrors,
} from '../errors.js';
import { OctokitTag } from '../octokit.js';

export const requestRepoPathContentsFromGitHubAPI = (
  format: 'object' | 'raw',
  streamBody?: boolean,
) =>
  gen(function* () {
    const octokit = yield* OctokitTag;

    const { gitRef, pathToEntityInRepo } = yield* InputConfigTag;
    const repo = yield* RepoConfigTag;

    return yield* tryPromise({
      try: signal =>
        octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner: repo.owner,
          repo: repo.name,
          path: pathToEntityInRepo,
          ...(gitRef && { ref: gitRef }),
          request: {
            signal,
            parseSuccessResponseBody: !streamBody,
          },
          mediaType: { format },
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }),
      catch: error => {
        if (!(error instanceof RequestError))
          return new UnknownException(
            error,
            'Failed to request contents at the path inside GitHub repo',
          );

        if (error.status === 404)
          return parseNotFoundErrors(error, gitRef);

        return parseCommonGitHubApiErrors(error);
      },
    });
  });

const parseNotFoundErrors = (error: RequestError, gitRef: string) => {
  if (
    (error.response as ResponseWithError)?.data?.message ===
    'This repository is empty.'
  )
    return new GitHubApiRepoIsEmpty(error);

  if (
    gitRef &&
    (error.response as ResponseWithError)?.data?.message?.startsWith(
      'No commit found for the ref',
    )
  )
    return new GitHubApiNoCommitFoundForGitRef(error, { gitRef });

  return new GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient(
    error,
  );
};

type ResponseWithError = OctokitResponse<
  { message?: string } | undefined,
  number
>;
