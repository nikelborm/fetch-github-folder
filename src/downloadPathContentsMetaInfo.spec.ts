import { it } from "@effect/vitest";
import { Octokit } from '@octokit/core';
import { Effect, flip, map, provideService, tryMapPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { deepStrictEqual } from 'node:assert';
import { text } from 'node:stream/consumers';
import {
  getPathContentsMetaInfo,
  GitHubApiBadCredentials,
  GitHubApiGeneralUserError,
  GitHubApiRepoDoesNotExistsOrPermissionsInsufficient,
  GitHubApiRepoIsEmpty,
  OctokitTag
} from './index.js';
import type { Repo } from './repo.interface.js';

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

it.effect(
  `Should return root directory`,
  (ctx) => pipe(
    getPathContentsMetaInfo({
      path: "",
      repo: {
        owner: 'fetch-gh-folder-tests',
        name: 'public-repo',
      }
    }),
    map(e => deepStrictEqual(e, {
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
      meta: 'This is root directory of the repo'
    })),
    provideService(
      OctokitTag,
      new Octokit()
    )
  ),
  { concurrent: true }
);


it.effect(
  `Should return file directly in root directory`,
  (ctx) => pipe(
    getPathContentsMetaInfo({
      path: "README.md",
      gitRef: "90a3d3cc0f107b11eb06c8148086de65eb86b676",
      repo: {
        owner: 'fetch-gh-folder-tests',
        name: 'public-repo',
      }
    }),
    tryMapPromise({
      try: async (info) => {
        if (info.type !== 'file') return;
        if (info.meta !== 'This file is less than 1 MB and was sent automatically') return;

        const { content, ...rest } = info;

        deepStrictEqual(
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
