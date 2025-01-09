import { gen, succeed } from 'effect/Effect';
import { ParseToReadableStream } from '../parseToReadableStream.js';
import { Repo } from '../repo.interface.js';
import { TaggedErrorVerifyingCause } from '../TaggedErrorVerifyingCause.js';
import { TapLogBoth } from '../TapLogBoth.js';
import { parseGitLFSObject } from './parseGitLFSObject.js';
import { requestPathContentsMetaInfoFromGitHubAPI } from './requestPathContentsMetaInfoFromGitHubAPI.js';

// : Effect<
//   (typeof ResponseSchema)['Type'],
//   | GitHubApiCommonErrors
//   | GitHubApiRepoIsEmpty
//   | GitHubApiRepoDoesNotExistsOrPermissionsInsufficient
//   | UnknownException
//   | ParseError,
//   OctokitTag
// >

export const getPathContentsMetaInfo = ({
  repo,
  gitRef,
  path: requestedPath
}: {
  repo: Repo,
  path: string,
  gitRef?: string | undefined,
}) => gen(function* () {
  const response = yield* requestPathContentsMetaInfoFromGitHubAPI({
    repo,
    gitRef,
    path: requestedPath
  });

  const MB = 1024 * 1024;

  const { type, name, path, sha, size } = response;

  if (requestedPath !== path) throw new Error(`Requested path (${requestedPath}) doesn't match returned path (${path})`)

  if (type === "dir") {
    const { entries } = response;
    if (!name || !path) return {
      type,
      treeSha: sha,
      entries,
      meta: "This root directory of the repo can be downloaded as a git tree"
    } as const
    return {
      type,
      name,
      path,
      treeSha: sha,
      entries,
      meta: "This nested directory can be downloaded as a git tree"
    } as const;
  }

  const { content, encoding, sha: _, ...base } = response;

  if (size < MB) {
    if (encoding === "none")
      return yield* new InconsistentEncodingWithSize({
        size,
        encoding: { actual: encoding }
      });

    const contentAsBuffer = Buffer.from(content, encoding);

    const potentialGitLFSObject = yield* parseGitLFSObject({
      contentAsBuffer,
      blobSha: sha,
      expectedContentSize: size,
      name,
      path,
    });

    if (potentialGitLFSObject !== "This is not a git LFS object")
      return potentialGitLFSObject;

    const stream = yield* ParseToReadableStream(succeed(contentAsBuffer));

    return {
      ...base,
      blobSha: sha,
      content: stream,
      meta: "This file is less than 1 MB and was sent automatically"
    } as const;
  } else if (size >= MB && size < /* <=? */ 100 * MB) {
    // From GitHub API documentation:
    // Between 1-100 MB: Only the raw or object custom media types are
    // supported. Both will work as normal, except that when using the
    // object media type, the content field will be an empty string and
    // the encoding field will be "none". To get the contents of these
    // larger files, use the raw media type.
    if (encoding !== "none")
      return yield* new InconsistentEncodingWithSize({
        size,
        encoding: {
          actual: encoding,
          expected: "none"
        }
      });

    return {
      ...base,
      blobSha: sha,
      meta: "This file can be downloaded as a blob"
    } as const
  } else {
    return {
      ...base,
      blobSha: sha,
      meta: "This file can be downloaded as a git-LFS object"
    } as const
  }
}).pipe(TapLogBoth);


export class InconsistentEncodingWithSize extends TaggedErrorVerifyingCause<{
  encoding: {
    actual: string,
    expected?: string,
  },
  size: number
}>()(
  'InconsistentEncodingWithSize',
  (ctx) => `Got "${ctx.encoding.actual}" encoding ${
      "expected" in ctx.encoding
        ? `while expecting "${ctx.encoding.expected}" encoding`
        : ''
    } for file with size ${ctx.size} bytes`,
) {}
