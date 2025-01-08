import { Effect, tap, tapError } from 'effect/Effect';
import { LogObjectNicely } from './logObjectNicely.js';

export const TapLogBoth = <A, E, R>(self: Effect<A, E, R>) => self.pipe(
  tap(LogObjectNicely),
  tapError(LogObjectNicely),
);
