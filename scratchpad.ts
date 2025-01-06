import { Octokit } from '@octokit/core';
import { pipe } from 'effect/Function';
import { provide, provideService, runPromise, succeed } from 'effect/Effect';
import { downloadPathContentsMetaInfo, LogObjectNicely, OctokitTag } from './src/index.js';
import { Effect } from 'effect';
import { NodeTerminal } from '@effect/platform-node';



await runPromise(
  pipe (
    downloadPathContentsMetaInfo({
      gitRef: 'HEAD',
      // path: 'docker/entrypoints/docker-ci.sh',
      path: 'levelParent/levelChild/temp2.txt',
      repo: {
        // owner: 'apache',
        // name: 'superset',

        // owner: 'nikelborm',
        // name: 'nikelborm',

        owner: 'nikelborm',
        name: 'empty-repo-api-test',
      }
    }),
    Effect.tap(LogObjectNicely),
    Effect.tapError(LogObjectNicely),
    provideService(
      OctokitTag,
      new Octokit({
        auth: '',
      })
    ),
    provide(NodeTerminal.layer),

  )
)
