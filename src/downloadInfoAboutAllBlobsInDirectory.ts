import { RequestError } from "@octokit/request-error";
import { UnknownException } from 'effect/Cause';
import {
  all,
  flatMap,
  tryMapPromise
} from 'effect/Effect';
import { pipe } from 'effect/Function';
import { Array as ArraySchema, decodeUnknownEither, NonEmptyTrimmedString, Struct } from 'effect/Schema';
import { RepoConfigTag } from './config.js';
import { OctokitTag } from './octokit.js';


/* : Effect<readonly Readonly<{
  pathInsideDirectory: string;
  url: string;
  fileMode: string;
}>[], RequestError | UnknownException | ParseError, OctokitTag> */

export const downloadInfoAboutAllBlobsInDirectory = (
  gitTreeShaHashOfDirectory: string
) => pipe(
  all([OctokitTag, RepoConfigTag]),
  tryMapPromise({
    try: async ([octokit, repo], signal) => {
      const { data: { tree } } = await octokit.request(
        'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
        {
          owner: repo.owner,
          repo: repo.name,
          tree_sha: gitTreeShaHashOfDirectory,
          request: { signal },
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
  flatMap(decodeBlobs)
);

const BlobsSchema = Struct({
  pathInsideDirectory: NonEmptyTrimmedString,
  url: NonEmptyTrimmedString,
  fileMode: NonEmptyTrimmedString,
}).pipe(ArraySchema);

const decodeBlobs = decodeUnknownEither(BlobsSchema, { exact: true });
