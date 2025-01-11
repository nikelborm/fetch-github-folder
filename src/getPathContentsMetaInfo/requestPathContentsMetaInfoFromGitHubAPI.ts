import { RequestError } from "@octokit/request-error";
import type { OctokitResponse } from "@octokit/types";
import { pipe } from 'effect';
import { UnknownException } from 'effect/Cause';
import { flatMap, tryMapPromise } from 'effect/Effect';
import { mapLeft } from 'effect/Either';
import { ParseError } from 'effect/ParseResult';
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
  GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient,
  GitHubApiRepoIsEmpty
} from '../errors.js';
import { OctokitTag } from '../octokit.js';
import { Repo } from '../repo.interface.js';
import { TaggedErrorVerifyingCause } from '../TaggedErrorVerifyingCause.js';
import { TapLogBoth } from '../TapLogBoth.js';
import { ParseToReadableStream } from 'src/parseToReadableStream.js';

const requestRepoPathContentsFromGitHubAPI = ({
  repo,
  gitRef,
  format,
  path,
  streamBody
}: {
  repo: Repo,
  path: string,
  format: 'object' | 'raw'
  gitRef?: string | undefined,
  streamBody?: boolean
}) => pipe(
  OctokitTag,
  tryMapPromise({
    try: (octokit, signal) => octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: repo.owner,
        repo: repo.name,
        path,
        ...(gitRef && { ref: gitRef }),
        request: {
          signal,
          parseSuccessResponseBody: !streamBody
        },
        mediaType: { format },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
      }
    ),
    catch: (error) => error instanceof RequestError
      ? (
        error.status === 404 && (error.response as ResponseWithError)?.data?.message === 'This repository is empty.'
          ? new GitHubApiRepoIsEmpty(error)
          : gitRef && error.status === 404 && (error.response as ResponseWithError)?.data?.message?.startsWith('No commit found for the ref')
          ? new GitHubApiNoCommitFoundForGitRef(error, { gitRef })
          // https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api?apiVersion=2022-11-28#failed-login-limit
          : error.status === 404
          ? new GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient(error)
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
  }),
)

export const requestPathContentsMetaInfoFromGitHubAPI = ({
  repo,
  gitRef,
  path
}: {
  repo: Repo,
  path: string,
  gitRef?: string | undefined,
}) => pipe(
  requestRepoPathContentsFromGitHubAPI({
    repo,
    gitRef,
    format: "object",
    path
  }),
  TapLogBoth,
  flatMap((response) => mapLeft(
    decodeResponse(response.data),
    parseError => new FailedToParseResponseFromRepoPathContentsMetaInfoAPI(
      parseError,
      { response }
    )
  ))
)

export const requestRawPathContentsFromGitHubAPI = ({
  repo,
  gitRef,
  path
}: {
  repo: Repo,
  path: string,
  gitRef?: string | undefined,
}) => pipe(
  requestRepoPathContentsFromGitHubAPI({
    repo,
    gitRef,
    format: "raw",
    streamBody: true,
    path
  }),
  ParseToReadableStream
)

const GitSomethingFields = {
  size: SchemaNumber,
  name: SchemaString,
  path: SchemaString,
  sha: SchemaString,
}

const dirLiteral = Literal('dir');
const nonDirLiterals = Literal('file', 'submodule', 'symlink');

export const ResponseSchema = Union(
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

export class FailedToParseResponseFromRepoPathContentsMetaInfoAPI extends TaggedErrorVerifyingCause<{
  response: unknown,
}>()(
  'FailedToParseResponseFromRepoPathContentsMetaInfoAPI',
  `Failed to parse response from repo path contents meta info API`,
  ParseError
) {}

type ResponseWithError = OctokitResponse<{ message?: string } | undefined, number>
