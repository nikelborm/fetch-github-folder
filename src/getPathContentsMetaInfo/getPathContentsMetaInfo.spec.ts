import { assert, it, } from "@effect/vitest";
import { Octokit } from '@octokit/core';
import { Effect, flip, map, provideService, tryMapPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as tsafe from "tsafe";
import { OctokitTag } from '../octokit.js';
import { getPathContentsMetaInfo } from './getPathContentsMetaInfo.js';
import type { Repo } from '../repo.interface.js';
import { text } from 'node:stream/consumers';
import { GitHubApiBadCredentials, GitHubApiGeneralUserError, GitHubApiNoCommitFoundForGitRef, GitHubApiRepoDoesNotExistsOrPermissionsInsufficient, GitHubApiRepoIsEmpty } from '../errors.js';

type EffectReadyErrors = (
  ReturnType<typeof getPathContentsMetaInfo> extends Effect<unknown, infer U, unknown>
    ? Extract<U, { _tag: unknown }>
    : never
);

const expectError = <const T extends EffectReadyErrors>({
  when,
  ExpectedErrorClass,
  authToken,
  repo,
  gitRef,
  path
}: {
  when: string,
  ExpectedErrorClass: { new (...args: any[]): T },
  authToken?: string | undefined,
  repo: Repo,
  gitRef?: string | undefined,
  path: string
}) => it.effect(
  `Should throw ${ExpectedErrorClass.name} when ${when}`,
  (ctx) => pipe(
    getPathContentsMetaInfo({ gitRef, path, repo }),
    flip,
    map(e => ctx.expect(e).toBeInstanceOf(ExpectedErrorClass)),
    provideService(
      OctokitTag,
      new Octokit({ auth: authToken })
    )
  ),
  { concurrent: true }
);


expectError({
  when: "asked for empty repo",
  ExpectedErrorClass: GitHubApiRepoIsEmpty,
  path: 'levelParent/levelChild/temp2.txt',
  repo: {
    owner: 'fetch-gh-folder-tests',
    name: 'empty-repo',
  },
})

expectError({
  when: "provided bad auth token",
  ExpectedErrorClass: GitHubApiBadCredentials,
  path: '',
  repo: {
    owner: 'asd',
    name: 'ssd',
  },
  authToken: 'bad auth token'
})

expectError({
  when: "asked for a private repo",
  ExpectedErrorClass: GitHubApiRepoDoesNotExistsOrPermissionsInsufficient,
  path: '',
  repo: {
    owner: 'fetch-gh-folder-tests',
    name: 'real-private-repo',
  }
})

expectError({
  when: "asked for nonexistent repo",
  ExpectedErrorClass: GitHubApiRepoDoesNotExistsOrPermissionsInsufficient,
  path: '',
  repo: {
    owner: 'fetch-gh-folder-tests',
    name: 'llllllllllllllllllllllllllll',
  },
})

expectError({
  when: "asked for nonexistent owner",
  ExpectedErrorClass: GitHubApiRepoDoesNotExistsOrPermissionsInsufficient,
  path: '',
  repo: {
    owner: 'llllllllllllllllllllllllllll',
    name: 'llllllllllllllllllllllllllll',
  },
})

expectError({
  when: "given broken path",
  ExpectedErrorClass: GitHubApiGeneralUserError,
  path: '///',
  repo: {
    owner: 'fetch-gh-folder-tests',
    name: 'public-repo',
  },
})

expectError({
  when: "given broken git ref",
  ExpectedErrorClass: GitHubApiNoCommitFoundForGitRef,
  path: '',
  gitRef: "807070987097809870987",
  repo: {
    owner: 'fetch-gh-folder-tests',
    name: 'public-repo',
  },
})

it.effect(
  `Should return root directory`,
  (ctx) => pipe(
    getPathContentsMetaInfo({
      path: "",
      gitRef: "aa01ad6b31edbfa41d18187215e7b9a35be34a1b",
      repo: {
        owner: 'fetch-gh-folder-tests',
        name: 'public-repo',
      }
    }),
    map(e => assert.deepStrictEqual(e, {
      type: 'dir',
      treeSha: '90a3d3cc0f107b11eb06c8148086de65eb86b676',
      entries: [
        {
          type: 'file',
          size: 13,
          name: 'README.md',
          path: 'README.md',
          sha: 'e0581c6516af41608a222765cfb582f0bf89ed47'
        }
      ],
      meta: 'This root directory of the repo can be downloaded as a git tree'
    })),
    provideService(
      OctokitTag,
      new Octokit()
    )
  ),
  { concurrent: true }
);


it.effect(
  `Should return little inlined file directly in root directory`,
  (ctx) => pipe(
    getPathContentsMetaInfo({
      path: "README.md",
      gitRef: "aa01ad6b31edbfa41d18187215e7b9a35be34a1b",
      repo: {
        owner: 'fetch-gh-folder-tests',
        name: 'public-repo',
      }
    }),
    tryMapPromise({
      try: async (info) => {
        tsafe.assert(tsafe.is<Extract<typeof info, {
          meta: 'This file is less than 1 MB and was sent automatically'
        }>>(info));

        const { content, ...rest } = info;

        assert.deepStrictEqual(
          {
            ...rest,
            content: await text(content)
          },
          {
            type: 'file',
            size: 13,
            name: 'README.md',
            path: 'README.md',
            blobSha: 'e0581c6516af41608a222765cfb582f0bf89ed47',
            meta: 'This file is less than 1 MB and was sent automatically',
            content: "# public-repo"
          }
        );
      },
      catch: (e) => e
    }),
    provideService(
      OctokitTag,
      new Octokit()
    )
  ),
  { concurrent: true }
);


it.effect(
  `Should return inlined file with size 1 byte less than 1mb placed directly in root directory`,
  (ctx) => pipe(
    getPathContentsMetaInfo({
      path: "1023kb+1023b_file.txt",
      gitRef: "6ca2b300cae4d49dbbd938060702c264b5ef055b",
      repo: {
        owner: 'fetch-gh-folder-tests',
        name: 'public-repo',
      }
    }),
    tryMapPromise({
      try: async (info) => {
        tsafe.assert(tsafe.is<Extract<typeof info, {
          meta: 'This file is less than 1 MB and was sent automatically'
        }>>(info));

        const { content, ...rest } = info;

        assert.deepStrictEqual(
          {
            ...rest,
            content: await text(content)
          },
          {
            type: 'file',
            size: 1024 * 1024 - 1,
            name: '1023kb+1023b_file.txt',
            path: '1023kb+1023b_file.txt',
            blobSha: '4ef7ad24ca43c487151fc6a194eb40fb715bf689',
            meta: 'This file is less than 1 MB and was sent automatically',
            content: "a".repeat(1024 * 1024 - 1)
          }
        );
      },
      catch: (e) => e
    }),
    provideService(
      OctokitTag,
      new Octokit()
    )
  ),
  { concurrent: true }
);

it.effect(
  `Should not inline file with 100mb size placed directly in root directory and return Git-LFS info`,
  (ctx) => pipe(
    getPathContentsMetaInfo({
      path: "100mb_file.txt",
      gitRef: "0362e8aec37c9146e1f946b27d98043a823357b7",
      repo: {
        owner: 'fetch-gh-folder-tests',
        name: 'public-repo',
      }
    }),
    tryMapPromise({
      try: async (info) => {
        tsafe.assert(tsafe.is<Extract<typeof info, {
          meta: 'This file can be downloaded as a git-LFS object'
        }>>(info));

        assert.deepStrictEqual(
          info,
          {
            type: 'file',
            size: 1024 * 1024 * 100,
            name: '100mb_file.txt',
            path: '100mb_file.txt',
            blobSha: '7557bc11dbc04337d33e6cd7e6b9bfa2d2d00e2b',
            meta: 'This file can be downloaded as a git-LFS object'
          }
        );
      },
      catch: (e) => e
    }),
    provideService(
      OctokitTag,
      new Octokit()
    )
  ),
  { concurrent: true }
);
