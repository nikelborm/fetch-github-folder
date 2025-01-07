import { Path } from "@effect/platform/Path";
import type { RequestError } from '@octokit/request-error';
import type { UnknownException } from 'effect/Cause';
import type { Effect } from 'effect/Effect';
import {
  flatMap,
  gen,
  tryMapPromise
} from "effect/Effect";
import { pipe } from 'effect/Function';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { extract } from 'tar-fs';
import { getGitTreeRefFromParentTreeRef } from './getGitTreeRefFromParentTreeRef.js';
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';
import type { OctokitTag } from './octokit.js';
import type { Repo } from './repo.interface.js';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';

export const downloadDirAndPutIntoFs = ({
  repo,
  pathToDirectoryInRepo,
  gitRef = 'HEAD',
  localDirPathToPutInsideRepoDirContents,
}: {
  repo: Repo,
  pathToDirectoryInRepo: string,
  localDirPathToPutInsideRepoDirContents: string,
  gitRef?: string | undefined,
}): Effect<void, RequestError | UnknownException | Error, OctokitTag | Path> => pipe(
  getNewGitTreeHashIfDirIsNested({
    repo,
    pathToDirectoryInRepo,
    gitRef,
  }),
  flatMap((newGitRef) =>
    getReadableTarGzStreamOfRepoDirectory(repo, newGitRef)
  ),
  tryMapPromise({
    try: (tarGzStream) => pipeline(
      tarGzStream,
      createGunzip(),
      extract(localDirPathToPutInsideRepoDirContents, {
        map: (header) => {
          // GitHub creates archive with nested dir inside that has all the
          // files we need, so we remove this dir's name from the beginning
          header.name = header.name.replace(/^[^/]*\/(.*)/, '$1');
          return header;
        }
      })
    ),
    catch: (error) => new Error(
      'Failed to extract received from GitHub .tar.gz archive',
      { cause: error }
    )
  }),
)

const getNewGitTreeHashIfDirIsNested = ({
  repo,
  pathToDirectoryInRepo,
  gitRef,
}: {
  repo: Repo,
  pathToDirectoryInRepo: string,
  gitRef: string,
}) => gen(function *() {
  const path = yield* Path;

  // dot can be there only when that's all there is. path.join(...)
  // removes all './', so '.' will never be just left by themself. If it's
  // there, it's very intentional and no other elements in the path exist.
  const cleanPath = path.join(pathToDirectoryInRepo);

  if (['.', './'].includes(cleanPath)) return gitRef;

  if (/^\.\..*/.test(cleanPath))
    yield* new AttemptedToGetDataAboveRepoRoot({
      problematicPath: pathToDirectoryInRepo
    });

  return yield* getGitTreeRefFromParentTreeRef({
    cleanPath,
    parentGitRef: gitRef,
    repo,
  })
});

export class AttemptedToGetDataAboveRepoRoot extends TaggedErrorVerifyingCause<{
  problematicPath: string
}>()(
  'AttemptedToGetDataAboveRepoRoot',
  'Error: Can\'t request contents that lie higher than the root of the repo'
) {}
