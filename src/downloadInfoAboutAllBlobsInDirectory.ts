import { RequestError } from "@octokit/request-error";
import { Effect as E, pipe, Schema as S } from 'effect';
import { UnknownException } from 'effect/Cause';
import { ParseError } from 'effect/ParseResult';
import { decodeUnknownEither, NonEmptyTrimmedString, Struct } from 'effect/Schema';
import { OctokitTag } from './octokit.js';
import { Repo } from './repo.interface.js';

export const downloadInfoAboutAllBlobsInDirectory = (
  repo: Repo,
  gitTreeShaHashOfDirectory: string
): E.Effect<readonly Readonly<{
  pathInsideDirectory: string;
  url: string;
  fileMode: string;
}>[], RequestError | UnknownException | ParseError, OctokitTag> => pipe(
  OctokitTag,
  E.tryMapPromise({
    try: async (octokit) => {
      const { data: { tree } } = await octokit.request(
        'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
        {
          owner: repo.owner,
          repo: repo.name,
          tree_sha: gitTreeShaHashOfDirectory,
          recursive: 'true',
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          },
        }
      );

      return tree.filter(({ type }) => type === 'blob');
    },
    catch: (error) => (error instanceof RequestError)
      ? error
      : new UnknownException(error, "Failed to request git trees from GitHub")
  }),
  // TODO: check if it's a directory I guess
  // TODO: try, catch and explain 404 normally
  E.flatMap(decodeBlobs)
);

const BlobsSchema = Struct({
  pathInsideDirectory: NonEmptyTrimmedString,
  url: NonEmptyTrimmedString,
  fileMode: NonEmptyTrimmedString,
}).pipe(S.Array);

const decodeBlobs = decodeUnknownEither(BlobsSchema, { exact: true });
