import { RequestError } from "@octokit/request-error";
import { UnknownException } from 'effect/Cause';
import {
  map,
  tryMapPromise,
  type Effect
} from 'effect/Effect';
import { pipe } from 'effect/Function';
import { type Readable } from 'node:stream';
import { OctokitTag } from './octokit.js';
import { type FailedToParseResponseToReadableStream, ParseToReadableStream } from './parseToReadableStream.js';
import { Repo } from './repo.interface.js';

export const getReadableTarGzStreamOfRepoDirectory = (
  repo: Repo,
  gitRef: string
): Effect<Readable, FailedToParseResponseToReadableStream | RequestError | UnknownException, OctokitTag> => pipe(
  OctokitTag,
  tryMapPromise({
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
  }),
  // TODO: PR to octokit to make tarball endpoint return ArrayBuffer instead of unknown
  map(({ data }) => data),
  ParseToReadableStream
);
