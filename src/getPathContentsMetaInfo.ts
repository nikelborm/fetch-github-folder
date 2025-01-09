import { RequestError } from "@octokit/request-error";
import { UnknownException } from 'effect/Cause';
import { gen, succeed, tryMapPromise } from 'effect/Effect';
import { isRight, left, mapLeft, match, right } from 'effect/Either';
import { ParseError } from 'effect/ParseResult';
import {
  Array as ArraySchema,
  decodeUnknownEither,
  Literal,
  NonEmptyTrimmedString,
  NumberFromString,
  Number as SchemaNumber,
  String as SchemaString,
  Struct,
  Union
} from 'effect/Schema';
import {
  GitHubApiAuthRatelimited,
  GitHubApiBadCredentials,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRef,
  GitHubApiRatelimited,
  GitHubApiRepoDoesNotExistsOrPermissionsInsufficient,
  GitHubApiRepoIsEmpty
} from './errors.js';
import { OctokitTag } from './octokit.js';
import { ParseToReadableStream } from './parseToReadableStream.js';
import { Repo } from './repo.interface.js';
import { GetSimpleFormError, TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';
import { TapLogBoth } from './TapLogBoth.js';

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
  const { data: unparsedData } = yield* requestPathContentsMetaInfoFromGitHubAPI({
    repo,
    gitRef,
    path: requestedPath
  });

  yield* succeed(unparsedData).pipe(TapLogBoth);

  const response = yield* mapLeft(
    decodeResponse(unparsedData),
    parseError => new FailedToParseResponseFromRepoContentsAPI(
      parseError,
      { unparsedData }
    )
  );

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

const GitSomethingFields = {
  size: SchemaNumber,
  name: SchemaString,
  path: SchemaString,
  sha: SchemaString,
}

const dirLiteral = Literal('dir');
const nonDirLiterals = Literal('file', 'submodule', 'symlink');

const ResponseSchema = Union(
  Struct({
    type: Literal('dir'),
    entries: Struct({
      type: Union(dirLiteral, nonDirLiterals),
      ...GitSomethingFields,
    }).pipe(ArraySchema),
    ...GitSomethingFields
  }),
  Struct({
    type: Literal('file'),
    encoding: Literal('base64', 'none'),
    content: SchemaString,
    ...GitSomethingFields,
  })
)

const decodeResponse = decodeUnknownEither(
  ResponseSchema,
  { exact: true }
);

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

const parseGitLFSObject = ({
  contentAsBuffer,
  expectedContentSize,
  blobSha,
  name,
  path,
}: {
  contentAsBuffer: Buffer<ArrayBuffer>,
  expectedContentSize: number,
  blobSha: string,
  name: string;
  path: string;
}) => {
  // gitLFS info usually is no longer than MAX_GIT_LFS_INFO_SIZE bytes
  const contentAsString = contentAsBuffer
    .subarray(0, MAX_GIT_LFS_INFO_SIZE)
    .toString("utf8");

  const parsingResult = mapLeft(
    decodeGitLFSInfoSchema(
      contentAsString.match(gitLFSInfoRegexp)?.groups
    ),
    cause => new FailedToParseGitLFSInfo(
      cause,
      { partOfContentThatCouldBeGitLFSInfo: contentAsString }
    )
  );

  const matchedByRegexpAndParsedByEffectSchema = isRight(parsingResult);
  const sizeFromGitLFSInfoAlignsWithExpectedContentSize = (
    isRight(parsingResult)
    && (parsingResult.right.size === expectedContentSize)
  );

  const shouldFailIfItIsNotGitLFS = contentAsBuffer.byteLength !== expectedContentSize;

  const thisIsGitLFSObject = matchedByRegexpAndParsedByEffectSchema
    && sizeFromGitLFSInfoAlignsWithExpectedContentSize;

  if (thisIsGitLFSObject) {
    return right({
      type: 'file',
      name,
      path,
      blobSha,
      size: expectedContentSize,
      gitLFSObjectIdSha256: parsingResult.right.oidSha256,
      gitLFSVersion: parsingResult.right.version,
      meta: "This file can be downloaded as a git-LFS object"
    } as const);
  } else if (shouldFailIfItIsNotGitLFS) {
    // If we weren't successful in parsing it as git LFS object
    // announcement using RegExp and Effect.Schema, we just do a basic size
    // consistency check. The check implements the second marker of it
    // being a Git LFS object as a backup to checking does "content" look
    // like a Git LFS object. If GitHub API's "size" field is different
    // from actual size of "content" field, it means either our schema with
    // regexp fucked up, or GitHub API did. If it doesn't throw, it means
    // there's no reason to assume it's a Git LFS object.
    return left(new InconsistentExpectedAndRealContentSize({
      path,
      actual: contentAsBuffer.byteLength,
      expected: expectedContentSize,
      gitLFSInfo: parsingResult.pipe(match({
        onLeft: left => ({
          meta: 'Failed to parse',
          error: left
        }),
        onRight: right => ({
          meta: 'Parsed successfully',
          value: right
        }),
      }))
    }))
  } else {
    return right("This is not a git LFS object" as const)
  }
}

export class InconsistentExpectedAndRealContentSize extends TaggedErrorVerifyingCause<{
  path: string,
  actual: number,
  expected: number,
  gitLFSInfo: {
    meta: 'Parsed successfully'
    value: (typeof GitLFSInfoSchema)['Type']
  } | {
    meta: 'Failed to parse'
    error: GetSimpleFormError<FailedToParseGitLFSInfo>
  }
}>()(
  'InconsistentExpectedAndRealContentSize',
  (ctx) => `Got file ${ctx.path} with size ${ctx.actual} bytes while expecting "${ctx.expected}" bytes`,
) {}

export class FailedToParseResponseFromRepoContentsAPI extends TaggedErrorVerifyingCause<{
  unparsedData: unknown,
}>()(
  'FailedToParseResponseFromRepoContentsAPI',
  `Failed to parse response from repo contents api`,
  ParseError
) {}

export class FailedToParseGitLFSInfo extends TaggedErrorVerifyingCause<{
  partOfContentThatCouldBeGitLFSInfo: string,
}>()(
  'FailedToParseGitLFSInfo',
  `Failed to parse git LFS announcement`,
  ParseError
) {}

// there are some responses that look like
// `version https://git-lfs.github.com/spec/v1
// oid sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// size 128
// `
// and the only variable thing in it is the size at the end, and I assume
// that supported file size is not greater than 100 GB
const MAX_GIT_LFS_INFO_SIZE = 137;
const gitLFSInfoRegexp = /^version (?<version>https:\/\/git-lfs\.github\.com\/spec\/v1)\noid sha256:(?<oidSha256>[0-9a-f]{64})\nsize (?<size>[1-9][0-9]{0,11})\n$/mg

const GitLFSInfoSchema = Struct({
  version: NonEmptyTrimmedString,
  oidSha256: NonEmptyTrimmedString,
  size: NumberFromString
})


const decodeGitLFSInfoSchema = decodeUnknownEither(
  GitLFSInfoSchema,
  { exact: true }
);

export const requestPathContentsMetaInfoFromGitHubAPI = ({
  repo,
  gitRef,
  path
}: {
  repo: Repo,
  path: string,
  gitRef?: string | undefined,
}) => OctokitTag.pipe(tryMapPromise({
  try: (octokit, signal) => octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    {
      owner: repo.owner,
      repo: repo.name,
      path,
      ...(gitRef && { ref: gitRef }),
      request: { signal },
      mediaType: { format: 'object' },
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
    }
  ),
  catch: (error) => error instanceof RequestError
    ? (
      error.status === 404 && (error.response?.data as any)?.message === 'This repository is empty.'
        ? new GitHubApiRepoIsEmpty(error)
        : gitRef && error.status === 404 && (error.response?.data as any)?.message?.startsWith('No commit found for the ref')
        ? new GitHubApiNoCommitFoundForGitRef(error, { gitRef })
        // https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api?apiVersion=2022-11-28#failed-login-limit
        : error.status === 404
        ? new GitHubApiRepoDoesNotExistsOrPermissionsInsufficient(error)
        : error.status === 401
        ? new GitHubApiBadCredentials(error)
        : error.status === 403
        ? new GitHubApiAuthRatelimited(error)
        : error.status === 429
        ? new GitHubApiRatelimited(error)
        : error.status >= 500
        ? new GitHubApiGeneralServerError(error)
        : error.status >= 400
        ? new GitHubApiGeneralUserError(error)
        : error
    )
    : new UnknownException(error, "Failed to request contents at the path inside GitHub repo")
}))
