import { Effect, gen } from 'effect/Effect';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';

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

    return yield* new FailedToCastDataToReadableStream();
  });

export class FailedToCastDataToReadableStream extends TaggedErrorVerifyingCause()(
  'FailedToCastDataToReadableStream',
  'Error: Failed to cast data to Readable stream, type of argument is not familiar',
) {}
