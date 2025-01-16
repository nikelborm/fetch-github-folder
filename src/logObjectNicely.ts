import { Console } from 'effect';

export const LogObjectNicely = (item: unknown) =>
  Console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });

export const logObjectNicely = (item: unknown) =>
  console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });
