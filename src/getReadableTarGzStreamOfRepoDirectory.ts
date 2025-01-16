import { RequestError } from "@octokit/request-error";
import { UnknownException } from 'effect/Cause';
import { all, map, tryMapPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { OctokitTag } from './octokit.js';
import { ParseToReadableStream } from './parseToReadableStream.js';
import { RepoConfigTag } from './config.js';

export const getReadableTarGzStreamOfRepoDirectory = (
  gitRefWhichWillBeUsedToIdentifyGitTree?: string
) => pipe(
  requestTarballFromGitHubAPI(gitRefWhichWillBeUsedToIdentifyGitTree),
  map(({ data }) => data),
  ParseToReadableStream
);

// TODO: PR to octokit to make tarball endpoint return ArrayBuffer instead of unknown

const requestTarballFromGitHubAPI = (
  gitRefWhichWillBeUsedToIdentifyGitTree = ''
) => all([OctokitTag, RepoConfigTag]).pipe(tryMapPromise({
  try: ([octokit, { owner, name }], signal) => octokit.request(
    'GET /repos/{owner}/{repo}/tarball/{ref}',
    {
      owner,
      repo: name,
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
