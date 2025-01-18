import { RequestError } from '@octokit/request-error';
import { UnknownException } from 'effect/Cause';
import { all, map, tryMapPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { RepoConfigTag } from './config.js';
import {
  GitHubApiGeneralUserError,
  parseCommonGitHubApiErrors,
} from './errors.js';
import { OctokitTag } from './octokit.js';
import { CastToReadableStream } from './castToReadableStream.js';

export const getReadableTarGzStreamOfRepoDirectory = (
  gitRefWhichWillBeUsedToIdentifyGitTree?: string,
) =>
  pipe(
    requestTarballFromGitHubAPI(gitRefWhichWillBeUsedToIdentifyGitTree),
    map(({ data }) => data),
    CastToReadableStream,
  );

const requestTarballFromGitHubAPI = (
  gitRefWhichWillBeUsedToIdentifyGitTree = '',
) =>
  tryMapPromise(all([OctokitTag, RepoConfigTag]), {
    try: ([octokit, { owner, name }], signal) =>
      octokit.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
        owner,
        repo: name,
        ref: gitRefWhichWillBeUsedToIdentifyGitTree,
        request: {
          signal,
          parseSuccessResponseBody: false,
        },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }),
    catch: error => {
      if (!(error instanceof RequestError))
        return new UnknownException(
          error,
          'Failed to request .tar.gz file from GitHub API',
        );

      if (error.status === 400)
        return new GitHubApiGeneralUserError(error, {
          notes:
            'Error happened probably because you asked for empty repo',
        });

      return parseCommonGitHubApiErrors(error);
    },
  });
