import { Tag, add, empty } from 'effect/Context';
import { Effect, provide, provideService } from 'effect/Effect';

export class InputConfigTag extends Tag('InputConfig')<
  InputConfigTag,
  Readonly<{
    repo: Readonly<{
      owner: string;
      name: string;
    }>;
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

export const provideInputConfig = (inputConfig: InputConfigTag['Type']) =>
  provideService(InputConfigTag, inputConfig);

export type SingleTargetConfig = InputConfigTag['Type'] &
  OutputConfigTag['Type'];

export const provideSingleDownloadTargetConfig = ({
  localPathAtWhichEntityFromRepoWillBeAvailable,
  ...inputConfig
}: SingleTargetConfig): (<A, E, R>(
  self: Effect<A, E, R>,
) => Effect<A, E, Exclude<R, InputConfigTag | OutputConfigTag>>) =>
  provide(
    empty().pipe(
      add(InputConfigTag, inputConfig),
      add(OutputConfigTag, {
        localPathAtWhichEntityFromRepoWillBeAvailable,
      }),
    ),
  );
