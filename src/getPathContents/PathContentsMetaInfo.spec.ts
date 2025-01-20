import {
  describe,
  it,
  RunnerTestCase,
  TaskContext,
  TestContext,
} from '@effect/vitest';
import { Octokit } from '@octokit/core';
import { RequestError } from '@octokit/request-error';
import { UnknownException } from 'effect/Cause';
import {
  all,
  andThen,
  asVoid,
  die,
  Effect,
  either,
  flatMap,
  gen,
  map,
  provide,
  provideService,
  succeed,
} from 'effect/Effect';
import { isRight } from 'effect/Either';
import { pipe } from 'effect/Function';
import { text } from 'node:stream/consumers';
import { FailedToCastDataToReadableStream } from 'src/castToReadableStream.js';
import { InputConfigTag, provideInputConfig } from '../configContext.js';
import {
  GitHubApiAuthRatelimited,
  GitHubApiBadCredentials,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRef,
  GitHubApiRatelimited,
  GitHubApiRepoIsEmpty,
  GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient,
} from '../errors.js';
import { OctokitLayer, OctokitTag } from '../octokit.js';
import type { IRepo } from '../repo.interface.js';
import { UnparsedMetaInfoAboutPathContentsFromGitHubAPI } from './ParsedMetaInfoAboutPathContentsFromGitHubAPI.js';
import { PathContentsMetaInfo } from './PathContentsMetaInfo.js';
import { RawStreamOfRepoPathContentsFromGitHubAPI } from './RawStreamOfRepoPathContentsFromGitHubAPI.js';

const defaultRepo = {
  owner: 'fetch-gh-folder-tests',
  name: 'public-repo',
};

const UnexpectedErrors = [
  RequestError,
  UnknownException,
  GitHubApiAuthRatelimited,
  GitHubApiRatelimited,
  GitHubApiGeneralServerError,
  FailedToCastDataToReadableStream,
];

type ErrorExpectedToBeThrown = (typeof UnexpectedErrors)[number] extends new (
  ...args: any
) => infer UnexpectedErrorInstance
  ? Exclude<
      typeof RawStreamOfRepoPathContentsFromGitHubAPI extends Effect<
        unknown,
        infer AllPotentialErrorInstances,
        unknown
      >
        ? AllPotentialErrorInstances
        : never,
      UnexpectedErrorInstance
    >
  : never;

type TestCtx = TaskContext<RunnerTestCase<{}>> & TestContext;

const effectsToTestForErrors = {
  RawStreamOfRepoPathContentsFromGitHubAPI,
  UnparsedMetaInfoAboutPathContentsFromGitHubAPI,
};

const testValidityOfErrorThrownByEffect =
  <const ExpectedErrorClass extends ErrorExpectedToBeThrown>(
    ctx: TestCtx,
    ExpectedErrorClass: new (...args: any) => ExpectedErrorClass,
    effectDescription: string,
  ) =>
  <
    EffectToTest extends
      (typeof effectsToTestForErrors)[keyof typeof effectsToTestForErrors],
  >(
    effectToTest: EffectToTest,
  ) =>
    effectToTest.pipe(
      asVoid as <E, R>(self: Effect<any, E, R>) => Effect<void, E, R>,
      either,
      flatMap(function (res) {
        if (isRight(res))
          return die({
            message:
              `Effect ${effectDescription} succeeded when expected to fail` as const,
            unexpectedlySuccessfulResult: res.right,
          });

        const err = res.left;

        ctx
          .expect(
            err,
            `Error thrown by ${effectDescription} was expected to be instance of ${
              ExpectedErrorClass.name
            }, but it's instance of ${err.constructor.name} instead`,
          )
          .toBeInstanceOf(ExpectedErrorClass);

        function assertOnlyExpectedErrors<T>(
          errorToCheck: T,
        ): asserts errorToCheck is Exclude<
          T,
          InstanceType<(typeof UnexpectedErrors)[number]>
        > {
          UnexpectedErrors.forEach(ErrorClassThatShouldNotBeReturned => {
            ctx
              .expect(
                errorToCheck,
                `Error thrown by ${effectDescription} should not be instance of ${ErrorClassThatShouldNotBeReturned.name}`,
              )
              .not.toBeInstanceOf(ErrorClassThatShouldNotBeReturned);
          });
        }

        assertOnlyExpectedErrors(err);

        return succeed(err);
      }),
    );

const expectError = <const ExpectedErrorClass extends ErrorExpectedToBeThrown>({
  when,
  ExpectedErrorClass,
  authToken,
  repo = defaultRepo,
  gitRef = '',
  pathToEntityInRepo,
}: {
  when: string;
  ExpectedErrorClass: new (...args: any) => ExpectedErrorClass;
  authToken?: string | undefined;
  repo?: IRepo;
  gitRef?: string | undefined;
  pathToEntityInRepo: string;
}) =>
  it.effect(
    `Should throw ${ExpectedErrorClass.name} when ${when}`,
    ctx =>
      gen(function* () {
        const validateErrorOf = <T extends keyof typeof effectsToTestForErrors>(
          chosenEffectName: T,
        ) => {
          const inputConfig = {
            repo,
            gitRef,
            pathToEntityInRepo,
          };
          const newKey = `ExpectedFailureOf${chosenEffectName}` as const;
          const newVal = effectsToTestForErrors[chosenEffectName].pipe(
            testValidityOfErrorThrownByEffect(
              ctx,
              ExpectedErrorClass,
              `${chosenEffectName} (${JSON.stringify(inputConfig)})`,
            ),
            provideInputConfig(inputConfig),
            provide(OctokitLayer({ auth: authToken })),
          );
          return { [newKey]: newVal } as {
            [k in typeof newKey]: typeof newVal;
          };
        };

        const {
          ExpectedFailureOfRawStreamOfRepoPathContentsFromGitHubAPI,
          ExpectedFailureOfUnparsedMetaInfoAboutPathContentsFromGitHubAPI,
        } = yield* all(
          {
            ...validateErrorOf('RawStreamOfRepoPathContentsFromGitHubAPI'),
            ...validateErrorOf(
              'UnparsedMetaInfoAboutPathContentsFromGitHubAPI',
            ),
          },
          { concurrency: 'unbounded' },
        );

        ctx
          .expect(
            ExpectedFailureOfUnparsedMetaInfoAboutPathContentsFromGitHubAPI,
          )
          .toStrictEqual(
            ExpectedFailureOfRawStreamOfRepoPathContentsFromGitHubAPI,
          );
      }),
    { concurrent: true },
  );

const expectNotFail = (
  descriptionOfWhatItShouldReturn: string,
  pathToEntityInRepo: string,
  testEffect: (
    ctx: TestCtx,
    pathContentsMetaInfo: typeof PathContentsMetaInfo,
  ) => Effect<unknown, unknown, OctokitTag | InputConfigTag>,
  authToken: string = '',
) =>
  it.effect(
    'Should return ' + descriptionOfWhatItShouldReturn,
    ctx =>
      pipe(
        testEffect(ctx, PathContentsMetaInfo),
        provideInputConfig({
          pathToEntityInRepo,
          gitRef: '',
          repo: defaultRepo,
        }),
        provideService(
          OctokitTag,
          new Octokit(authToken ? { auth: authToken } : void 0),
        ),
      ),
    { concurrent: true },
  );

describe('PathContentsMetaInfo', () => {
  expectError({
    when: 'asked for empty repo',
    ExpectedErrorClass: GitHubApiRepoIsEmpty,
    pathToEntityInRepo: 'levelParent/levelChild/temp2.txt',
    repo: {
      owner: 'fetch-gh-folder-tests',
      name: 'empty-repo',
    },
  });

  expectError({
    when: 'provided bad auth token',
    ExpectedErrorClass: GitHubApiBadCredentials,
    pathToEntityInRepo: '',
    repo: {
      owner: 'asd',
      name: 'ssd',
    },
    authToken: 'bad auth token',
  });

  expectError({
    when: 'asked for a private repo',
    ExpectedErrorClass:
      GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient,
    pathToEntityInRepo: '',
    repo: {
      owner: 'fetch-gh-folder-tests',
      name: 'real-private-repo',
    },
  });

  expectError({
    when: 'asked for nonexistent repo',
    ExpectedErrorClass:
      GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient,
    pathToEntityInRepo: '',
    repo: {
      owner: 'fetch-gh-folder-tests',
      name: 'llllllllllllllllllllllllllll',
    },
  });

  expectError({
    when: 'asked for nonexistent owner',
    ExpectedErrorClass:
      GitHubApiSomethingDoesNotExistsOrPermissionsInsufficient,
    pathToEntityInRepo: '',
    repo: {
      owner: 'llllllllllllllllllllllllllll',
      name: 'llllllllllllllllllllllllllll',
    },
  });

  expectError({
    when: 'given broken path',
    ExpectedErrorClass: GitHubApiGeneralUserError,
    pathToEntityInRepo: '///',
  });

  expectError({
    when: 'given broken git ref',
    ExpectedErrorClass: GitHubApiNoCommitFoundForGitRef,
    pathToEntityInRepo: '',
    gitRef: '807070987097809870987',
  });

  expectNotFail(`children of root directory`, '', (ctx, pathContentsMetaInfo) =>
    map(pathContentsMetaInfo, e =>
      ctx.expect(e).toMatchInlineSnapshot(`
        {
          "entries": [
            {
              "name": ".gitattributes",
              "path": ".gitattributes",
              "sha": "236917878e566c0f8ec5db75938d074b8df259c9",
              "size": 51,
              "type": "file",
            },
            {
              "name": "100mb_file.txt",
              "path": "100mb_file.txt",
              "sha": "7557bc11dbc04337d33e6cd7e6b9bfa2d2d00e2b",
              "size": 134,
              "type": "file",
            },
            {
              "name": "1023kb+1023b_file.txt",
              "path": "1023kb+1023b_file.txt",
              "sha": "4ef7ad24ca43c487151fc6a194eb40fb715bf689",
              "size": 1048575,
              "type": "file",
            },
            {
              "name": "1mb_file.txt",
              "path": "1mb_file.txt",
              "sha": "7c7377879f52df073befeb0cb7df4d1a4b6b7563",
              "size": 1048576,
              "type": "file",
            },
            {
              "name": "README.md",
              "path": "README.md",
              "sha": "e0581c6516af41608a222765cfb582f0bf89ed47",
              "size": 13,
              "type": "file",
            },
            {
              "name": "fake_git_lfs.txt",
              "path": "fake_git_lfs.txt",
              "sha": "7557bc11dbc04337d33e6cd7e6b9bfa2d2d00e2b",
              "size": 134,
              "type": "file",
            },
            {
              "name": "index.js",
              "path": "index.js",
              "sha": "927d79ca931f4512ec3798abef6624e53f9d6ad3",
              "size": 193,
              "type": "file",
            },
            {
              "name": "package.json",
              "path": "package.json",
              "sha": "96ae6e57eb3980436bae7749ddbdca84b4978cc2",
              "size": 24,
              "type": "file",
            },
            {
              "name": "parentFolderDirectlyInRoot",
              "path": "parentFolderDirectlyInRoot",
              "sha": "51106992bea30bb953ac5754e54bb968ab0dcbe5",
              "size": 0,
              "type": "dir",
            },
          ],
          "meta": "This root directory of the repo can be downloaded as a git tree",
          "treeSha": "eb10ce40a99007c3dd4f2e120c2de77850d1d5f4",
          "type": "dir",
        }
      `),
    ),
  );

  expectNotFail(
    `little inlined file directly in root directory`,
    'README.md',
    (ctx, pathContentsMetaInfo) =>
      gen(function* () {
        const info = yield* pathContentsMetaInfo;

        if (
          info.meta !==
          'This file is small enough that GitHub API decided to inline it'
        )
          throw new Error("File wasn't inlined");

        const { contentStream, ...rest } = info;

        ctx.expect({
          ...rest,
          content: yield* andThen(contentStream, text),
        }).toMatchInlineSnapshot(`
        {
          "blobSha": "e0581c6516af41608a222765cfb582f0bf89ed47",
          "content": "# public-repo",
          "meta": "This file is small enough that GitHub API decided to inline it",
          "name": "README.md",
          "path": "README.md",
          "size": 13,
          "type": "file",
        }
      `);
      }),
  );

  expectNotFail(
    `inlined file with size 1 byte less than 1mb placed directly in root directory`,
    '1023kb+1023b_file.txt',
    (ctx, pathContentsMetaInfo) =>
      gen(function* () {
        const info = yield* pathContentsMetaInfo;

        if (
          info.meta !==
          'This file is small enough that GitHub API decided to inline it'
        )
          throw new Error("File wasn't inlined");

        const { contentStream, ...rest } = info;

        ctx
          .expect({
            ...rest,
            content: yield* andThen(contentStream, text),
          })
          .toEqual({
            type: 'file',
            size: 1024 * 1024 - 1,
            name: '1023kb+1023b_file.txt',
            path: '1023kb+1023b_file.txt',
            blobSha: '4ef7ad24ca43c487151fc6a194eb40fb715bf689',
            meta: 'This file is small enough that GitHub API decided to inline it',
            content: 'a'.repeat(1024 * 1024 - 1),
          });
      }),
  );

  expectNotFail(
    `blob info for file with size exactly 1mb`,
    '1mb_file.txt',
    (ctx, pathContentsMetaInfo) =>
      map(pathContentsMetaInfo, e =>
        ctx.expect(e).toMatchInlineSnapshot(`
        {
          "blobSha": "7c7377879f52df073befeb0cb7df4d1a4b6b7563",
          "meta": "This file can be downloaded as a blob",
          "name": "1mb_file.txt",
          "path": "1mb_file.txt",
          "size": 1048576,
          "type": "file",
        }
      `),
      ),
  );

  expectNotFail(`Git-LFS info`, '100mb_file.txt', (ctx, pathContentsMetaInfo) =>
    map(pathContentsMetaInfo, e =>
      ctx.expect(e).toMatchInlineSnapshot(`
        {
          "blobSha": "7557bc11dbc04337d33e6cd7e6b9bfa2d2d00e2b",
          "gitLFSObjectIdSha256": "cee41e98d0a6ad65cc0ec77a2ba50bf26d64dc9007f7f1c7d7df68b8b71291a6",
          "gitLFSVersion": "https://git-lfs.github.com/spec/v1",
          "meta": "This file can be downloaded as a git-LFS object",
          "name": "100mb_file.txt",
          "path": "100mb_file.txt",
          "size": 104857600,
          "type": "file",
        }
      `),
    ),
  );

  expectNotFail(
    `little inlined file inside of a nested directory`,
    'parentFolderDirectlyInRoot/childFolder/nestedFile.md',
    (ctx, pathContentsMetaInfo) =>
      gen(function* () {
        const info = yield* pathContentsMetaInfo;

        if (
          info.meta !==
          'This file is small enough that GitHub API decided to inline it'
        )
          throw new Error("File wasn't inlined");

        const { contentStream, ...rest } = info;

        ctx.expect({
          ...rest,
          content: yield* andThen(contentStream, text),
        }).toMatchInlineSnapshot(`
        {
          "blobSha": "24ebb076f9e46157c4abdc6e7b69a775eb38d6a4",
          "content": "# Nested file
        ",
          "meta": "This file is small enough that GitHub API decided to inline it",
          "name": "nestedFile.md",
          "path": "parentFolderDirectlyInRoot/childFolder/nestedFile.md",
          "size": 14,
          "type": "file",
        }
      `);
      }),
  );

  expectNotFail(
    `children of nested directory`,
    'parentFolderDirectlyInRoot/childFolder',
    (ctx, pathContentsMetaInfo) =>
      map(pathContentsMetaInfo, e =>
        ctx.expect(e).toMatchInlineSnapshot(`
        {
          "entries": [
            {
              "name": "nestedFile.md",
              "path": "parentFolderDirectlyInRoot/childFolder/nestedFile.md",
              "sha": "24ebb076f9e46157c4abdc6e7b69a775eb38d6a4",
              "size": 14,
              "type": "file",
            },
          ],
          "meta": "This nested directory can be downloaded as a git tree",
          "name": "childFolder",
          "path": "parentFolderDirectlyInRoot/childFolder",
          "treeSha": "ea5690c87fc1cb6b88cb953f29f826daeb2e43ab",
          "type": "dir",
        }
      `),
      ),
  );
});
