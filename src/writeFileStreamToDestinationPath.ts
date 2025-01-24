import { Effect, gen, tryPromise } from 'effect/Effect';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { OutputConfigTag } from './configContext.js';
import {
  TaggedErrorClassWithUnknownCauseAndNoContext,
  TaggedErrorVerifyingCause,
} from './TaggedErrorVerifyingCause.js';

export const writeFileStreamToDestinationPath = <E, R>(
  self: Effect<Readable, E, R>,
) =>
  gen(function* () {
    const fileStream = yield* self;

    const {
      localPathAtWhichEntityFromRepoWillBeAvailable: localDownloadedFilePath,
    } = yield* OutputConfigTag;

    yield* tryPromise({
      try: signal =>
        pipeline(fileStream, createWriteStream(localDownloadedFilePath), {
          signal,
        }),
      catch: cause =>
        new FailedToWriteFileStreamToDestinationPathError({ cause }),
    });
  });

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type FailedToWriteFileStreamToDestinationPathErrorClass =
  TaggedErrorClassWithUnknownCauseAndNoContext<'FailedToWriteFileStreamToDestinationPathError'>;

export type FailedToWriteFileStreamToDestinationPathError =
  InstanceType<FailedToWriteFileStreamToDestinationPathErrorClass>;

export const FailedToWriteFileStreamToDestinationPathError: FailedToWriteFileStreamToDestinationPathErrorClass =
  TaggedErrorVerifyingCause<{
    cause: unknown;
  }>()(
    'FailedToWriteFileStreamToDestinationPathError',
    'Error: Failed to write file stream to destination path',
  );
