import { RequestError } from "@octokit/request-error";
import { pipe } from 'effect/Function';
import { UnknownException } from 'effect/Cause';
import {
  fail,
  flatMap,
  try as tryEffect,
  tryMapPromise,
  type Effect
} from 'effect/Effect';
import { OctokitTag } from './octokit.js';
import { Repo } from './repo.interface.js';
import { Readable } from 'node:stream';

export const getReadableTarGzStreamOfRepoDirectory = (
  repo: Repo,
  gitRef: string
): Effect<Readable, Error | RequestError | UnknownException, OctokitTag> => pipe(
  OctokitTag,
  tryMapPromise({
    try: (octokit) => octokit.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
      owner: repo.owner,
      repo: repo.name,
      ref: gitRef,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }),
    catch: (error) => (error instanceof RequestError)
      ? error
      : new UnknownException(error, "Failed to request tarball from GitHub")
  }),
  // TODO: PR to octokit that tarball returns ArrayBuffer instead of unknown
  flatMap(({ data }) => data instanceof ArrayBuffer
    ? tryEffect(() => new Readable({
      read() {
        this.push(Buffer.from(data));
        this.push(null);
      }
    }))
    : fail(new Error(`Octokit returned something that's not ArrayBuffer`))
  ),
);
