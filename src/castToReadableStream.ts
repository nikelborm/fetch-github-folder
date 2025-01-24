import { Effect, gen } from 'effect/Effect';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import {
  TaggedErrorClassWithNoContextAndNoCause,
  buildTaggedErrorClassVerifyingCause,
} from './TaggedErrorVerifyingCause.js';

export const CastToReadableStream = <E, R>(self: Effect<unknown, E, R>) =>
  gen(function* () {
    const data = yield* self;

    if (data instanceof ArrayBuffer || data instanceof Buffer)
      return new Readable({
        read() {
          this.push(data);
          this.push(null);
        },
      });

    if (data instanceof ReadableStream) return Readable.fromWeb(data);

    if (data instanceof Readable) return data;

    return yield* new FailedToCastDataToReadableStreamError();
  });

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference

export type FailedToCastDataToReadableStreamErrorClass =
  TaggedErrorClassWithNoContextAndNoCause<'FailedToCastDataToReadableStreamError'>;

export type FailedToCastDataToReadableStreamError =
  InstanceType<FailedToCastDataToReadableStreamErrorClass>;

/**
 * Error that happens when some of the3
 *
 * @class FailedToCastDataToReadableStreamError FailedToCastDataToReadableStreamError
 * @classdesc This is a description of the sss class.
 * @constructs FailedToCastDataToReadableStreamError
 */
export const FailedToCastDataToReadableStreamError: FailedToCastDataToReadableStreamErrorClass =
  buildTaggedErrorClassVerifyingCause()(
    'FailedToCastDataToReadableStreamError',
    'Error: Failed to cast data to Readable stream, type of argument is not familiar',
  );
