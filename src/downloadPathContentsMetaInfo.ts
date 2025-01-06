import { RequestError } from "@octokit/request-error";
import { UnknownException } from 'effect/Cause';
import {
  flatMap,
  tap,
  tryMapPromise,
  type Effect
} from 'effect/Effect';
import { pipe } from 'effect/Function';
import { ParseError } from 'effect/ParseResult';
import { Array as ArraySchema, Number as SchemaNumber, decodeUnknownEither, Literal, String as SchemaString, Struct, Union } from 'effect/Schema';
import { GitHubApiAuthRatelimited, GitHubApiBadCredentials, GitHubApiCommonErrors, GitHubApiGeneralServerError, GitHubApiGeneralUserError, GitHubApiRatelimited, GitHubApiRepoDoesNotExistsOrPermissionsInsufficient, GitHubApiRepoIsEmpty } from './errors.js';
import { OctokitTag } from './octokit.js';
import { Repo } from './repo.interface.js';
import { LogObjectNicely } from './logObjectNicely.js';

export const downloadPathContentsMetaInfo = ({
  repo,
  gitRef,
  path
}: {
  repo: Repo,
  path: string,
  gitRef: string,
}): Effect<
  (typeof ResponseSchema)['Type'],
  | GitHubApiCommonErrors
  | GitHubApiRepoIsEmpty
  | GitHubApiRepoDoesNotExistsOrPermissionsInsufficient
  | UnknownException
  | ParseError,
  OctokitTag
> => pipe(
  OctokitTag,
  tryMapPromise({
    try: (octokit, signal) => octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: repo.owner,
        repo: repo.name,
        path,
        ref: gitRef,
        request: {
          signal,
        },
        mediaType: {
          format: 'object'
        },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
      }
    ),
    catch: (error) => (error instanceof RequestError)
      ? error.status === 500
        ? new GitHubApiGeneralServerError(error)
        : error.status === 400
        ? new GitHubApiGeneralUserError(error)
        : error.status === 404 && (error.response?.data as any)?.message === 'This repository is empty.'
        ? new GitHubApiRepoIsEmpty(error)
        : error.status === 404
        ? new GitHubApiRepoDoesNotExistsOrPermissionsInsufficient(error)
        : error.status === 401
        ? new GitHubApiBadCredentials(error)
        : error.status === 403
        ? new GitHubApiAuthRatelimited(error)
        : error.status === 429
        ? new GitHubApiRatelimited(error)
        : error
      : new UnknownException(error, "Failed to request contents at the path inside GitHub repo")
  }),
  tap(LogObjectNicely),
  flatMap(({ data }) => decodeResponse(data))
);


// Between 1-100 MB: Only the raw or object custom media types are
// supported. Both will work as normal, except that when using the object
// media type, the content field will be an empty string and the encoding
// field will be "none". To get the contents of these larger files, use the
// raw media type.


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
