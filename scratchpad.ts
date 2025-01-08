import { NodeTerminal } from '@effect/platform-node';
import { Octokit } from '@octokit/core';
import { provide, provideService, runPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { getPathContentsMetaInfo, OctokitTag } from './src/index.js';
import { TapLogBoth } from './src/TapLogBoth.js';


await runPromise(
  pipe(
    getPathContentsMetaInfo({
      path: "",
      repo: {
        owner: 'fetch-gh-folder-tests',
        name: 'public-repo',
      }
    }),
    TapLogBoth,
    provideService(
      OctokitTag,
      new Octokit({
        auth: '',
      })
    ),
    provide(NodeTerminal.layer),
  )
)
