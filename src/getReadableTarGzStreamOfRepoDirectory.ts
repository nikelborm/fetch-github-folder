import { NodeStream } from '@effect/platform-node';
import { RequestError } from "@octokit/request-error";
import { pipe } from 'effect';
import { UnknownException } from 'effect/Cause';
import {
  fail,
  flatMap,
  succeed,
  tryMapPromise,
} from 'effect/Effect';
import { OctokitTag } from './octokit.js';
import { Repo } from './repo.interface.js';

export const getReadableTarGzStreamOfRepoDirectory = (
  repo: Repo,
  gitRef: string
) => pipe(
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
    ? succeed(new Uint8Array(data))
    : fail(new Error(`Octokit returned something that's not ArrayBuffer`))
  ),
  NodeStream.toReadable
);
