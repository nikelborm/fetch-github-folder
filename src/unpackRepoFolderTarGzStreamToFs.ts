import { Effect, gen, tryPromise } from 'effect/Effect';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { extract } from 'tar-fs';
import { OutputConfigTag } from './configContext.js';
import {
  ReturnTypeUnknownCauseNoStatic,
  TaggedErrorVerifyingCause,
} from './TaggedErrorVerifyingCause.js';

export const unpackRepoFolderTarGzStreamToFs = <E, R>(
  self: Effect<Readable, E, R>,
) =>
  gen(function* () {
    const tarGzStream = yield* self;

    const {
      localPathAtWhichEntityFromRepoWillBeAvailable:
        pathToLocalDirWhichWillHaveContentsOfRepoDir,
    } = yield* OutputConfigTag;

    yield* tryPromise({
      try: signal =>
        pipeline(
          tarGzStream,
          createGunzip(),
          extract(pathToLocalDirWhichWillHaveContentsOfRepoDir, {
            map: header => {
              // GitHub creates archive with nested dir inside which has all
              // the files we need, so we remove this dir's name from the
              // beginning
              header.name = header.name.replace(/^[^/]*\/(.*)/, '$1');
              return header;
            },
          }),
          { signal },
        ),
      catch: cause => new FailedToUnpackRepoFolderTarGzStreamToFs({ cause }),
    });
  });

// Extracted to a const to please JSR
const _Err: ReturnTypeUnknownCauseNoStatic<'FailedToUnpackRepoFolderTarGzStreamToFs'> =
  TaggedErrorVerifyingCause<{
    cause: unknown;
  }>()(
    'FailedToUnpackRepoFolderTarGzStreamToFs',
    'Error: Failed to unpack to fs received from GitHub .tar.gz stream of repo folder contents',
  );

export class FailedToUnpackRepoFolderTarGzStreamToFs extends _Err {}
