import { it } from "@effect/vitest";
import { Octokit } from '@octokit/core';
import { flip, map, provideService, Effect } from 'effect/Effect';
import { pipe } from 'effect/Function';
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
    getPathContentsMetaInfo({
      gitRef,
      path,
      repo
    }),
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
