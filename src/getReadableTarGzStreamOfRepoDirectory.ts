import { RequestError } from "@octokit/request-error";
import { pipe } from 'effect/Function';
import { UnknownException } from 'effect/Cause';
import {
  fail,
  flatMap,
  succeed,
  try as tryEffect,
  tryMapPromise,
  type Effect
} from 'effect/Effect';
import { OctokitTag } from './octokit.js';
import { Repo } from './repo.interface.js';
import { Readable, Stream } from 'node:stream';

export const getReadableTarGzStreamOfRepoDirectory = (
  repo: Repo,
  gitRef: string
): Effect<Readable, Error | RequestError | UnknownException, OctokitTag> => pipe(
  OctokitTag,
  tryMapPromise({
    try: (octokit, signal) => octokit.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
      owner: repo.owner,
      repo: repo.name,
      ref: gitRef,
      request: {
        parseSuccessResponseBody: false,
        signal,
      },
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }),
    catch: (error) => (error instanceof RequestError)
      ? error
      : new UnknownException(error, "Failed to request tarball from GitHub")
  }),
  // TODO: PR to octokit to make tarball endpoint return ArrayBuffer instead of unknown
  flatMap(({ data }) => data instanceof ArrayBuffer
    ? succeed(new Readable({
      read() {
        this.push(Buffer.from(data));
        this.push(null);
      }
    }))
    : data instanceof Readable
    ? succeed(data)
    : fail(new Error(`Octokit returned something that's not ArrayBuffer or Stream`))
  ),
);
