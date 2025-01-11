import { tryMapPromise } from "effect/Effect";
import { pipe } from 'effect/Function';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { extract } from 'tar-fs';
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';
import type { Repo } from '../repo.interface.js';

export const downloadRepoDirAndPutItIntoFs = ({
  repo,
  gitRefWhichWillBeUsedToIdentifyGitTree,
  pathToLocalDirWhichWillHaveContentsOfRepoDir,
}: {
  repo: Repo,
  pathToLocalDirWhichWillHaveContentsOfRepoDir: string,
  gitRefWhichWillBeUsedToIdentifyGitTree?: string | undefined,
}) => pipe(
  getReadableTarGzStreamOfRepoDirectory(repo, gitRefWhichWillBeUsedToIdentifyGitTree),
  tryMapPromise({
    try: (tarGzStream, signal) => pipeline(
      tarGzStream,
      createGunzip(),
      extract(pathToLocalDirWhichWillHaveContentsOfRepoDir, {
        map: (header) => {
          // GitHub creates archive with nested dir inside which has all
          // the files we need, so we remove this dir's name from the
          // beginning
          header.name = header.name.replace(/^[^/]*\/(.*)/, '$1');
          return header;
        }
      }),
      { signal }
    ),
    catch: (error) => new Error(
      'Failed to extract received from GitHub .tar.gz archive',
      { cause: error }
    )
  }),
)
