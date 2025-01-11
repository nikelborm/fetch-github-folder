import { RequestError } from "@octokit/request-error";
import { UnknownException } from 'effect/Cause';
import { map, tryMapPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { OctokitTag } from '../octokit.js';
import { ParseToReadableStream } from '../parseToReadableStream.js';
import { Repo } from '../repo.interface.js';

export const getReadableTarGzStreamOfRepoDirectory = (
  repo: Repo,
  gitRefWhichWillBeUsedToIdentifyGitTree?: string
) => pipe(
  requestTarballFromGitHubAPI(repo, gitRefWhichWillBeUsedToIdentifyGitTree),
  map(({ data }) => data),
  ParseToReadableStream
);

// TODO: PR to octokit to make tarball endpoint return ArrayBuffer instead of unknown

const requestTarballFromGitHubAPI = (
  repo: Repo,
  gitRefWhichWillBeUsedToIdentifyGitTree = ''
) => OctokitTag.pipe(tryMapPromise({
  try: (octokit, signal) => octokit.request(
    'GET /repos/{owner}/{repo}/tarball/{ref}',
    {
      owner: repo.owner,
      repo: repo.name,
      ref: gitRefWhichWillBeUsedToIdentifyGitTree,
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
    ? error // TODO: add the same extensive error parsing as in other places
    : new UnknownException(error, "Failed to request tarball from GitHub")
}));
