import { NodeTerminal } from '@effect/platform-node';
import { Octokit } from '@octokit/core';
import { provide, provideService, runPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { getPathContentsMetaInfo, OctokitTag } from './src/index.js';
import { TapLogBoth } from './src/TapLogBoth.js';


await runPromise(
  pipe(
    getPathContentsMetaInfo({
      path: "1023kb+1023b_file.txt",
      gitRef: "6ca2b300cae4d49dbbd938060702c264b5ef055b",
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
