import { pipe } from 'effect/Function';
import { Repo } from './repo.interface.js';
import { fail, gen, tryPromise } from 'effect/Effect';
import { Path } from '@effect/platform/Path';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';
import { getPathContentsMetaInfo, requestRawRepoPathContentsFromGitHubAPI } from './getPathContents/index.js';
import { downloadRepoDirAndPutItIntoFs } from './downloadRepoDirAndPutItIntoFs/index.js';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

export const downloadEntityFromRepo = ({
  repo,
  pathToEntityInRepo: dirtyPathToEntityInRepo,
  gitRef,
  localPathAtWhichEntityFromRepoWillBeAvailable,
}: {
  repo: Repo,
  pathToEntityInRepo: string,
  localPathAtWhichEntityFromRepoWillBeAvailable: string,
  gitRef?: string | undefined,
}) => gen(function* () {
  const path = yield* Path;

  // dot can be there only when that's all there is. path.join(...)
  // removes all './', so '.' will never be just left by themself. If it's
  // there, it's very intentional and no other elements in the path exist.
  const pathToEntityInRepo = path.join(dirtyPathToEntityInRepo);

  if (pathToEntityInRepo.startsWith('..'))
    return yield* new AttemptedToGetDataAboveRepoRoot({
      problematicPath: pathToEntityInRepo
    });

  const pathContentsMetaInfo = yield* getPathContentsMetaInfo({
    repo,
    gitRef,
    path: pathToEntityInRepo,
  });

  if (pathContentsMetaInfo.type === 'dir')
    return yield* downloadRepoDirAndPutItIntoFs({
      repo,
      gitRefWhichWillBeUsedToIdentifyGitTree: pathContentsMetaInfo.treeSha,
      pathToLocalDirWhichWillHaveContentsOfRepoDir:
        localPathAtWhichEntityFromRepoWillBeAvailable,
    })

  if (pathContentsMetaInfo.meta === 'This file is small enough that GitHub API decided to inline it')
    return yield* tryPromise({
      try: (signal) => pipeline(
        pathContentsMetaInfo.content,
        createWriteStream(
          localPathAtWhichEntityFromRepoWillBeAvailable,
        ),
        { signal }
      ),
      catch: (error) => new Error(
        'Failed ',
        { cause: error }
      )
    })

  if (pathContentsMetaInfo.meta === 'This file can be downloaded as a blob') {
    const fileStream = yield* requestRawRepoPathContentsFromGitHubAPI({
      repo,
      path: pathContentsMetaInfo.path,
      gitRef: pathContentsMetaInfo.blobSha
    })
    return yield* tryPromise({
      try: (signal) => pipeline(
        fileStream,
        createWriteStream(
          localPathAtWhichEntityFromRepoWillBeAvailable,
        ),
        { signal }
      ),
      catch: (error) => new Error(
        'Failed ',
        { cause: error }
      )
    })
  }
  yield* fail(new Error('LFS files are not yet supported'))
  // pathContentsMetaInfo
})


export class AttemptedToGetDataAboveRepoRoot extends TaggedErrorVerifyingCause<{
  problematicPath: string
}>()(
  'AttemptedToGetDataAboveRepoRoot',
  'Error: Can\'t request contents that lie higher than the root of the repo'
) {}
