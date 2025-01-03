import { Path } from "@effect/platform";
import { Effect as E, pipe } from "effect";
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import tarFs from 'tar-fs';
import { getGitTreeRefFromParentTreeRef } from './getGitTreeRefFromParentTreeRef.js';
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';
import { Repo } from './repo.interface.js';

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
}) => pipe(
  getNewGitTreeHashIfDirIsNested({
    repo,
    pathToDirectoryInRepo,
    gitRef,
  }),
  E.flatMap((newGitRef) =>
    getReadableTarGzStreamOfRepoDirectory(repo, newGitRef)
  ),
  E.tryMapPromise({
    try: (tarGzStream) => pipeline(
      tarGzStream,
      createGunzip(),
      tarFs.extract(localDirPathToPutInsideRepoDirContents, {
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
}) => E.gen(function *() {
  const path = yield* Path.Path;

  // dot can be there only when that's all there is. path.join(...)
  // removes all './', so '.' will never be just left by themself. If it's
  // there, it's very intentional and no other elements in the path exist.
  const cleanPath = path.join(pathToDirectoryInRepo);

  if (['.', './'].includes(cleanPath))
    return E.succeed(gitRef);

  if (/^\.\..*/.test(cleanPath))
    return E.fail(new Error(
      `Can't go higher than the root of the repo: ${pathToDirectoryInRepo}`
    ));

  return getGitTreeRefFromParentTreeRef({
    cleanPath,
    parentGitRef: gitRef,
    repo,
  })
}).pipe(E.flatten);
