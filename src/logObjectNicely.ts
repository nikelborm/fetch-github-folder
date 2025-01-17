import { dir } from 'effect/Console';

export const LogObjectNicely = (item: unknown) =>
  dir(item, {
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
