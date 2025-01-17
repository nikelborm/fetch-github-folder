import { Effect, gen, tryPromise } from 'effect/Effect';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { OutputConfigTag } from './config.js';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';

export const writeFileStreamToDestinationPath = <E, R>(
  self: Effect<Readable, E, R>,
) =>
  gen(function* () {
    const fileStream = yield* self;

    const {
      localPathAtWhichEntityFromRepoWillBeAvailable:
        localDownloadedFilePath,
    } = yield* OutputConfigTag;

    yield* tryPromise({
      try: signal =>
        pipeline(fileStream, createWriteStream(localDownloadedFilePath), {
          signal,
        }),
      catch: cause =>
        new FailedToWriteFileStreamToDestinationPath({ cause }),
    });
  });

export class FailedToWriteFileStreamToDestinationPath extends TaggedErrorVerifyingCause<{
  cause: unknown;
}>()(
  'FailedToWriteFileStreamToDestinationPath',
  'Error: Failed to write file stream to destination path',
) {}
