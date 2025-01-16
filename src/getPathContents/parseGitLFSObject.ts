import { isRight, left, mapLeft, match, right } from 'effect/Either';
import { ParseError } from 'effect/ParseResult';
import {
  decodeUnknownEither,
  NonEmptyTrimmedString,
  NumberFromString,
  Struct,
} from 'effect/Schema';
import { TaggedErrorVerifyingCause } from '../TaggedErrorVerifyingCause.js';
import { outdent } from 'outdent';

export const parseGitLFSObject = ({
  contentAsBuffer,
  expectedContentSize,
  blobSha,
  fileName,
  pathToFileInRepo,
}: {
  contentAsBuffer: Buffer<ArrayBuffer>;
  expectedContentSize: number;
  blobSha: string;
  fileName: string;
  pathToFileInRepo: string;
}) => {
  // gitLFS info usually is no longer than MAX_GIT_LFS_INFO_SIZE bytes
  const contentAsString = contentAsBuffer
    .subarray(0, MAX_GIT_LFS_INFO_SIZE)
    .toString('utf8');

  const parsingResult = mapLeft(
    decodeGitLFSInfoSchema(
      contentAsString.match(gitLFSInfoRegexp)?.groups,
    ),
    cause =>
      new FailedToParseGitLFSInfo(cause, {
        partOfContentThatCouldBeGitLFSInfo: contentAsString,
      }),
  );

  const matchedByRegexpAndParsedByEffectSchema = isRight(parsingResult);
  const sizeFromGitLFSInfoAlignsWithExpectedContentSize =
    isRight(parsingResult) &&
    parsingResult.right.size === expectedContentSize;

  const shouldFailIfItIsNotGitLFS =
    contentAsBuffer.byteLength !== expectedContentSize;

  const thisIsGitLFSObject =
    matchedByRegexpAndParsedByEffectSchema &&
    sizeFromGitLFSInfoAlignsWithExpectedContentSize;

  if (thisIsGitLFSObject)
    return right({
      type: 'file',
      name: fileName,
      path: pathToFileInRepo,
      blobSha,
      size: expectedContentSize,
      gitLFSObjectIdSha256: parsingResult.right.oidSha256,
      gitLFSVersion: parsingResult.right.version,
      meta: 'This file can be downloaded as a git-LFS object',
    } as const);

  if (shouldFailIfItIsNotGitLFS)
    return left(
      new InconsistentExpectedAndRealContentSize({
        path: pathToFileInRepo,
        actual: contentAsBuffer.byteLength,
        expected: expectedContentSize,
        gitLFSInfo: parsingResult.pipe(
          match({
            onLeft: left => ({
              meta: 'Failed to parse',
              error: left,
            }),
            onRight: right => ({
              meta: 'Parsed successfully',
              value: right,
            }),
          }),
        ),
      }),
    );

  return right('This is not a git LFS object' as const);
};

// there are some responses that look like
// `version https://git-lfs.github.com/spec/v1
// oid sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// size 128
// `
// and the only variable thing in it is the size at the end, and I assume
// that supported file size is not greater than 100 GB
const MAX_GIT_LFS_INFO_SIZE = 137;
// Don't add regexp /g modifier, it breaks match groups
const gitLFSInfoRegexp =
  /^version (?<version>https:\/\/git-lfs\.github\.com\/spec\/v1)\noid sha256:(?<oidSha256>[0-9a-f]{64})\nsize (?<size>[1-9][0-9]{0,11})\n$/m;

const GitLFSInfoSchema = Struct({
  version: NonEmptyTrimmedString,
  oidSha256: NonEmptyTrimmedString,
  size: NumberFromString,
});

const decodeGitLFSInfoSchema = decodeUnknownEither(GitLFSInfoSchema, {
  exact: true,
});

export class FailedToParseGitLFSInfo extends TaggedErrorVerifyingCause<{
  partOfContentThatCouldBeGitLFSInfo: string;
}>()(
  'FailedToParseGitLFSInfo',
  `Failed to parse git LFS announcement`,
  ParseError,
) {}

export class InconsistentExpectedAndRealContentSize extends TaggedErrorVerifyingCause<{
  path: string;
  actual: number;
  expected: number;
  gitLFSInfo:
    | {
        meta: 'Parsed successfully';
        value: (typeof GitLFSInfoSchema)['Type'];
      }
    | {
        meta: 'Failed to parse';
        error: FailedToParseGitLFSInfo;
      };
}>()(
  'InconsistentExpectedAndRealContentSize',
  ctx =>
    `Got file ${ctx.path} with size ${ctx.actual} bytes while expecting ${ctx.expected} bytes`,
  void 0,
  {
    comment: outdent({ newline: ' ' })`
    If we weren't successful in parsing it as git LFS object
    announcement using RegExp and Effect.Schema, we just do a basic size
    consistency check. The check implements the second marker of it
    being a Git LFS object as a backup to checking does "content" look
    like a Git LFS object. If GitHub API's "size" field is different
    from actual size of "content" field, it means either our schema with
    regexp fucked up, or GitHub API did. If it doesn't throw, it means
    there's no reason to assume it's a Git LFS object.
  `,
  },
) {}
