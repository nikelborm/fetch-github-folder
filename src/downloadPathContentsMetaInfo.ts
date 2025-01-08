import { RequestError } from "@octokit/request-error";
import { UnknownException } from 'effect/Cause';
import { succeed, gen, tryMapPromise, tryPromise } from 'effect/Effect';
import {
  Array as ArraySchema,
  decodeUnknownEither,
  Literal,
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
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';
import { pipe } from 'effect';
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
  path
}: {
  repo: Repo,
  path: string,
  gitRef?: string | undefined,
}) => gen(function* () {
  const { data: unparsedContents } = yield* requestPathContentsMetaInfoFromGitHubAPI({
    repo,
    gitRef,
    path
  });

  yield* succeed(unparsedContents).pipe(TapLogBoth);

  const response = yield* decodeResponse(unparsedContents);

  const MB = 1024 * 1024;

  if (response.type === "dir") {
    if (!response.name && !response.path) return {
      type: "dir",
      treeSha: response.sha,
      entries: response.entries,
      meta: "This is root directory of the repo"
    } as const
    return response;
  }

  const { content, encoding, sha, ...base } = response;

  if (response.size < MB) {
    if (response.encoding === "none")
      return yield* new InconsistentEncodingWithSize({
        size: response.size,
        encoding: { actual: encoding }
      });

    const stream = yield* ParseToReadableStream(
      succeed(Buffer.from(
        response.content,
        response.encoding
      ))
    );
    return {
      ...base,
      blobSha: sha,
      content: stream,
      meta: "This file is less than 1 MB and was sent automatically"
    } as const;
  } else if (response.size >= MB && response.size < /* <=? */ 100 * MB) {
    // From GitHub API documentation:
    // Between 1-100 MB: Only the raw or object custom media types are
    // supported. Both will work as normal, except that when using the
    // object media type, the content field will be an empty string and
    // the encoding field will be "none". To get the contents of these
    // larger files, use the raw media type.
    if (response.encoding !== "none")
      return yield* new InconsistentEncodingWithSize({
        size: response.size,
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

const requestPathContentsMetaInfoFromGitHubAPI = ({
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
