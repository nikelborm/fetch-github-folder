import { gen } from 'effect/Effect';
import { mapLeft } from 'effect/Either';
import { ParseError } from 'effect/ParseResult';
import {
  Array as ArraySchema,
  decodeUnknownEither,
  Literal,
  Number as SchemaNumber,
  String as SchemaString,
  Struct,
  Union,
} from 'effect/Schema';
import { TaggedErrorVerifyingCause } from '../TaggedErrorVerifyingCause.js';
import { RepoPathContentsFromGitHubAPI } from './RepoPathContentsFromGitHubAPI.js';

export const UnparsedMetaInfoAboutPathContentsFromGitHubAPI =
  RepoPathContentsFromGitHubAPI('object');

export const ParsedMetaInfoAboutPathContentsFromGitHubAPI = gen(function* () {
  const response = yield* UnparsedMetaInfoAboutPathContentsFromGitHubAPI;

  return yield* mapLeft(
    decodeResponse(response.data),
    parseError =>
      new FailedToParseResponseFromRepoPathContentsMetaInfoAPI(parseError, {
        response,
      }),
  );
});

const GitSomethingFields = {
  size: SchemaNumber,
  name: SchemaString,
  path: SchemaString,
  sha: SchemaString,
};

const dirLiteral = Literal('dir');
const nonDirLiterals = Literal('file', 'submodule', 'symlink');

export const ResponseSchema = Union(
  Struct({
    type: Literal('dir'),
    entries: Struct({
      type: Union(dirLiteral, nonDirLiterals),
      ...GitSomethingFields,
    }).pipe(ArraySchema),
    ...GitSomethingFields,
  }),
  Struct({
    type: Literal('file'),
    encoding: Literal('base64', 'none'),
    content: SchemaString,
    ...GitSomethingFields,
  }),
);

const decodeResponse = decodeUnknownEither(ResponseSchema, {
  exact: true,
});

export class FailedToParseResponseFromRepoPathContentsMetaInfoAPI extends TaggedErrorVerifyingCause<{
  response: unknown;
}>()(
  'FailedToParseResponseFromRepoPathContentsMetaInfoAPI',
  `Failed to parse response from repo path contents meta info API`,
  ParseError,
) {}
