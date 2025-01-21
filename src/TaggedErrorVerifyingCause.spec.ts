import { ParseError, Unexpected } from 'effect/ParseResult';
import { outdent } from 'outdent';
import { describe, it } from '@effect/vitest';
import {
  FailedToParseGitLFSInfo,
  InconsistentExpectedAndRealContentSize,
} from './getPathContents/index.js';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';
import { right } from 'effect/Either';

describe('TaggedErrorVerifyingCause', { concurrent: true }, () => {
  it('Should have expected fields from both contexts: dynamic and static ', ctx => {
    const dynamicContext = {
      actual: 12,
      expected: 13,
      gitLFSInfo: right({
        oidSha256: 'iosdvhksjsl',
        size: 14,
        version: 'lakdvfhjaljskhk',
      }),
    } as const;

    const error = new InconsistentExpectedAndRealContentSize(dynamicContext);

    ctx.expect(error).toBeInstanceOf(InconsistentExpectedAndRealContentSize);

    const extractedNeedFields = (({
      actual,
      _tag,
      name,
      message,
      expected,
      gitLFSInfo,
      comment,
    }) => ({
      actual,
      _tag,
      name,
      message,
      expected,
      gitLFSInfo,
      comment,
    }))(error);

    ctx.expect(extractedNeedFields).toEqual({
      _tag: 'InconsistentExpectedAndRealContentSize',
      name: 'InconsistentExpectedAndRealContentSize',
      message: 'Got file with size 12 bytes while expecting 13 bytes',
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
      ...dynamicContext,
    });
  });

  it('Should throw when incorrect cause provided during constructor call', ctx => {
    try {
      const error = new FailedToParseGitLFSInfo(
        new Error('bad error') as ParseError,
        {
          partOfContentThatCouldBeGitLFSInfo:
            'Part of content that could be git lfs info',
        },
      );
      throw new Error(
        "new FailedToParseGitLFSInfo(...) should throw, but didn't",
        { cause: error },
      );
    } catch (error) {
      ctx.expect(error).toBeInstanceOf(Error);
      ctx
        .expect((error as Error).message)
        .toBe(
          'Provided cause of incorrect type to "FailedToParseGitLFSInfo" class. Expected cause class: "ParseError"',
        );
    }
  });

  it('Should not try to call message string', ctx => {
    const causeOriginal = new ParseError({
      issue: new Unexpected('asdf'),
    });

    const error = new FailedToParseGitLFSInfo(causeOriginal, {
      partOfContentThatCouldBeGitLFSInfo:
        'Part of content that could be git lfs info',
    });

    const extractedNeedFields = (({
      _tag,
      name,
      message,
      cause,
      partOfContentThatCouldBeGitLFSInfo,
    }) => ({
      _tag,
      name,
      message,
      cause,
      partOfContentThatCouldBeGitLFSInfo,
    }))(error);

    ctx.expect(extractedNeedFields).toEqual({
      _tag: 'FailedToParseGitLFSInfo',
      name: 'FailedToParseGitLFSInfo',
      message: 'Failed to parse git LFS announcement',
      cause: causeOriginal,
      partOfContentThatCouldBeGitLFSInfo:
        'Part of content that could be git lfs info',
    });
  });

  it('Should pass cause and full context when message renderer is called and ExpectedCauseClass is provided', ctx => {
    class CustomCauseErrorClass extends Error {
      constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
      }
    }

    class CustomTaggedError extends TaggedErrorVerifyingCause<{
      dynamicContextField1: string;
    }>()(
      'CustomTaggedError',
      (cause, fullContext) =>
        [
          cause.name,
          cause.message,
          fullContext.dynamicContextField1,
          fullContext.staticContextField2,
        ].join(','),
      CustomCauseErrorClass,
      {
        staticContextField2: 123,
      },
    ) {}

    const causeOriginal = new CustomCauseErrorClass('test message');

    const error = new CustomTaggedError(causeOriginal, {
      dynamicContextField1: 'Dynamic context field1',
    });

    const extractedNeedFields = (({
      _tag,
      name,
      message,
      cause,
      staticContextField2,
      dynamicContextField1,
    }) => ({
      _tag,
      name,
      message,
      cause,
      staticContextField2,
      dynamicContextField1,
    }))(error);

    ctx.expect(extractedNeedFields).toEqual({
      _tag: 'CustomTaggedError',
      name: 'CustomTaggedError',
      message: 'CustomCauseErrorClass,test message,Dynamic context field1,123',
      cause: causeOriginal,
      dynamicContextField1: 'Dynamic context field1',
      staticContextField2: 123,
    });
  });
});
