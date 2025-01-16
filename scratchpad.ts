import { Command, Options } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Config, Console, Effect, pipe } from 'effect';
import { flatMap } from 'effect/Option';

function validateNameHandle(s: string) {
  return !!s.match(/^[a-z0-9.\-_]+$/gi);
}
const badNameMessage = `Name should have only ASCII letters, digits, and the characters ".", "-", and "_"`;

export const nameConfig = pipe(
  Config.string('NAME'),
  Config.validate({
    message: badNameMessage,
    validation: validateNameHandle,
  }),
);

const nameCLIOption = pipe(
  Options.text('name'),
  Options.withFallbackConfig(nameConfig),
  // Options.withSchema(
  //   Schema.String.pipe(
  //     Schema.filter(s => validateNameHandle(s) || badNameMessage),
  //   ),
  // ),
);

console.dir(nameCLIOption, {
  colors: true,
  compact: false,
  depth: null,
});

const appCommand = Command.make('cli', { nameCLIOption }, x =>
  Console.log(x),
);

const cli = Command.run(appCommand, {
  name: 'cli',
  version: '0.1.0',
});

pipe(
  process.argv,
  cli,
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
);

// const program = Effect.gen(function* () {
//   const name = yield* nameConfig;
//   console.log(`Name env var: ${name}`);
// });

// await Effect.runPromise(program);
