import { Tag, empty, add } from 'effect/Context';
import { pipe } from 'effect/Function';
import type { Readonly } from 'ts-toolbelt/out/Object/Readonly.d.ts';

export class RepoConfigTag extends Tag('RepoConfig')<
  RepoConfigTag,
  Readonly<{
    owner: string;
    name: string;
  }>
>() {}

export class InputConfigTag extends Tag('InputConfig')<
  InputConfigTag,
  Readonly<{
    pathToEntityInRepo: string;
    gitRef: string;
  }>
>() {}

export class OutputConfigTag extends Tag('OutputConfig')<
  OutputConfigTag,
  Readonly<{
    localPathAtWhichEntityFromRepoWillBeAvailable: string;
  }>
>() {}

export const createInputConfigContext = ({
  repo,
  ...inputConfig
}: InputConfigTag['Type'] & { readonly repo: RepoConfigTag['Type'] }) =>
  pipe(
    empty(),
    add(RepoConfigTag, repo),
    add(InputConfigTag, inputConfig),
  );

export const createSingleTargetConfigContext = ({
  localPathAtWhichEntityFromRepoWillBeAvailable,
  ...inputConfig
}: InputConfigTag['Type'] & {
  repo: RepoConfigTag['Type'];
} & OutputConfigTag['Type']) =>
  pipe(
    createInputConfigContext(inputConfig),
    add(OutputConfigTag, {
      localPathAtWhichEntityFromRepoWillBeAvailable,
    }),
  );
