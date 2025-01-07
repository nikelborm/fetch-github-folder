import { RequestError } from "@octokit/request-error";
import { RuntimeException, UnknownException } from 'effect/Cause';
import {
  fail,
  flatMap,
  gen,
  map,
  tap,
  tryMapPromise,
  tryPromise,
  type Effect
} from 'effect/Effect';
import { pipe } from 'effect/Function';
import { ParseError } from 'effect/ParseResult';
import { Array as ArraySchema, Number as SchemaNumber, decodeUnknownEither, Literal, String as SchemaString, Struct, Union } from 'effect/Schema';
import { GitHubApiAuthRatelimited, GitHubApiBadCredentials, GitHubApiCommonErrors, GitHubApiGeneralServerError, GitHubApiGeneralUserError, GitHubApiRatelimited, GitHubApiRepoDoesNotExistsOrPermissionsInsufficient, GitHubApiRepoIsEmpty } from './errors.js';
import { OctokitTag } from './octokit.js';
import { Repo } from './repo.interface.js';
import { LogObjectNicely } from './logObjectNicely.js';
import { ParseToReadableStream } from './parseToReadableStream.js';

// : Effect<
//   (typeof ResponseSchema)['Type'],
//   | GitHubApiCommonErrors
//   | GitHubApiRepoIsEmpty
//   | GitHubApiRepoDoesNotExistsOrPermissionsInsufficient
//   | UnknownException
//   | ParseError,
//   OctokitTag
// >

export const downloadPathContentsMetaInfo = ({
  repo,
  gitRef = 'HEAD',
  path
}: {
  repo: Repo,
  path: string,
  gitRef?: string | undefined,
}) => gen(function* () {
    const octokit = yield* OctokitTag;

    const { data: unparsedContents } = yield* tryPromise({
      try: (signal) => octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner: repo.owner,
          repo: repo.name,
          path,
          ref: gitRef,
          request: { signal },
          mediaType: { format: 'object' },
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          },
        }
      ),
      catch: (error) =>
        error instanceof RequestError
          ? (error.status === 404 && (error.response?.data as any)?.message === 'This repository is empty.'
            ? new GitHubApiRepoIsEmpty(error)
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
    });

    const response = yield* decodeResponse(unparsedContents);
    const MB = 1024 * 1024;

    if (response.type !== "file") return response;

    const { content, encoding, ...base } = response;

    if (response.size < /* <=? */ MB) {
      if (response.encoding === "none")
        return yield* fail(
          new InconsistentEncodingWithSize(
            { actual: encoding },
            response.size
          )
        );

      const stream = yield* ParseToReadableStream(
        Buffer.from(response.content, response.encoding)
      );
      return {
        ...base,
        content: stream,
        meta: "This file is less than 1 MB and was sent automatically" as const
      };
    } else if (response.size >= /* >? */ MB && response.size < /* <=? */ 100 * MB) {
      // From GitHub API documentation:
      // Between 1-100 MB: Only the raw or object custom media types are
      // supported. Both will work as normal, except that when using the
      // object media type, the content field will be an empty string and
      // the encoding field will be "none". To get the contents of these
      // larger files, use the raw media type.
      if (response.encoding === "base64")
        return yield* fail(
          new InconsistentEncodingWithSize(
            { actual: encoding, expected: "none" },
            response.size
          )
        );

      return {
        ...base,
        meta: "This file can be downloaded as a blob" as const
      }
    } else {
      return {
        ...base,
        meta: "This file can be downloaded as a git-LFS object" as const
      }
    }
});

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

export class InconsistentEncodingWithSize extends Error {
  readonly _tag: string;

  constructor(
    readonly encoding: Readonly<{
      actual: string,
      expected?: string,
    }>,
    readonly size: number
  ) {
    super(`Got "${encoding.actual}" encoding ${
      "expected" in encoding
        ? `while expecting "${encoding.expected}" encoding`
        : ''
    } for file with size ${size} bytes`)
    this._tag = this.constructor.name;
  }
}
