import { fail, succeed } from 'effect/Effect';
import { Readable } from 'node:stream';

export const ParseToReadableStream =
  (data: unknown) => (data instanceof ArrayBuffer || data instanceof Buffer)
    ? succeed(new Readable({
      read() {
        this.push(data);
        this.push(null);
      }
    }))
    : data instanceof Readable
    ? succeed(data)
    : fail(new FailedToParseResponseToReadableStream())


export class FailedToParseResponseToReadableStream extends Error {
  readonly _tag: string;

  constructor() {
    super('Failed to parse data to readable stream')
    this._tag = this.constructor.name;
  }
}
