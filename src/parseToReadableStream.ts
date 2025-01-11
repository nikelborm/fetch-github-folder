import { Effect, gen } from 'effect/Effect';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web'
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';

export const ParseToReadableStream = <E, R>(self: Effect<unknown, E, R>) =>
  gen(function* () {
    const data = yield* self;
    console.log(console.constructor.name, data);

    if (data instanceof ArrayBuffer || data instanceof Buffer)
      return new Readable({
        read() {
          this.push(data);
          this.push(null);
        }
      });

    if (data instanceof ReadableStream)
      return Readable.fromWeb(data);

    if (data instanceof Readable)
      return data;

    return yield * new FailedToParseDataToReadableStream()
  })

export class FailedToParseDataToReadableStream extends TaggedErrorVerifyingCause()(
  'FailedToParseDataToReadableStream',
  'Failed to parse data to readable stream',
) {}
