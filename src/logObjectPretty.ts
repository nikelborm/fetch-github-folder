import { flow } from 'effect';
import { dir } from 'effect/Console';
import { Effect, tap, tapError } from 'effect/Effect';

export const LogObjectPretty = (item: unknown) =>
  dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });

export const LogSuccessObjectPretty = <A, E, R>(self: Effect<A, E, R>) =>
  tap(self, LogObjectPretty);

export const LogErrorObjectPretty = <A, E, R>(self: Effect<A, E, R>) =>
  tapError(self, LogObjectPretty);

export const TapLogBoth = flow(
  LogSuccessObjectPretty,
  LogErrorObjectPretty,
);

export const logObjectPretty = (item: unknown) =>
  console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });
