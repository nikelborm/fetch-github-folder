import { Effect, all, tryMapPromise } from "effect/Effect";
import { pipe } from 'effect/Function';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { extract } from 'tar-fs';
import { Readable } from 'node:stream';
import { OutputConfigTag } from 'src/config.js';

export const unpackRepoFolderTarGzStreamToFs = <E, R>(
  self: Effect<Readable, E, R>
) => pipe(
  all([self, OutputConfigTag]),
  tryMapPromise({
    try: ([tarGzStream, {
      localPathAtWhichEntityFromRepoWillBeAvailable:
        pathToLocalDirWhichWillHaveContentsOfRepoDir
    }], signal) => pipeline(
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
  })
)
