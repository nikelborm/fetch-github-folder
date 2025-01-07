import { RequestError } from "@octokit/request-error";
import { UnknownException } from 'effect/Cause';
import { map, tryMapPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { OctokitTag } from './octokit.js';
import { ParseToReadableStream } from './parseToReadableStream.js';
import { Repo } from './repo.interface.js';

export const getReadableTarGzStreamOfRepoDirectory = (
  repo: Repo,
  gitRef: string
) => pipe(
  requestTarballFromGitHubAPI(repo, gitRef),
  map(({ data }) => data),
  ParseToReadableStream
);

// TODO: PR to octokit to make tarball endpoint return ArrayBuffer instead of unknown

const requestTarballFromGitHubAPI = (
  repo: Repo,
  gitRef: string
) => OctokitTag.pipe(tryMapPromise({
  try: (octokit, signal) => octokit.request(
    'GET /repos/{owner}/{repo}/tarball/{ref}',
    {
      owner: repo.owner,
      repo: repo.name,
      ref: gitRef,
      request: {
        signal,
        parseSuccessResponseBody: false,
      },
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  ),
  catch: (error) => (error instanceof RequestError)
    ? error
    : new UnknownException(error, "Failed to request tarball from GitHub")
}));
