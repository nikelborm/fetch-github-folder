import { Command as CliCommand, Span } from '@effect/cli';
import { Command as PlatformCommand } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { CommandExecutor } from '@effect/platform/CommandExecutor';
import { FileSystem } from '@effect/platform/FileSystem';
import { Path } from '@effect/platform/Path';
import { describe, it } from '@effect/vitest';
import { fn, gen, map, provide } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { merge } from 'effect/Layer';
import { decodeText, runFold, type Stream } from 'effect/Stream';
import { allWithInheritedConcurrencyByDefault } from './src/allWithInheritedConcurrency.ts';
import {
  destinationPathCLIOptionBackedByEnv,
  downloadEntityFromRepo,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
  pathToEntityInRepoCLIOptionBackedByEnv,
  repoNameCLIOptionBackedByEnv,
  repoOwnerCLIOptionBackedByEnv,
} from './src/index.ts';
import pkg from './package.json' with { type: 'json' };
import { buildTaggedErrorClassVerifyingCause } from './src/TaggedErrorVerifyingCause.ts';

const appCommand = CliCommand.make(
  pkg.name,
  {
    repo: {
      owner: repoOwnerCLIOptionBackedByEnv,
      name: repoNameCLIOptionBackedByEnv,
    },
    pathToEntityInRepo: pathToEntityInRepoCLIOptionBackedByEnv,
    localPathAtWhichEntityFromRepoWillBeAvailable:
      destinationPathCLIOptionBackedByEnv,
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  downloadEntityFromRepo,
);

const cli = (args: ReadonlyArray<string>) =>
  CliCommand.run(appCommand, {
    name: pkg.name,
    version: pkg.version,
    summary: Span.text(pkg.description),
  })(['node', '-', ...args]);

const MainLive = merge(NodeContext.layer, OctokitLayer());

type Params = {
  gitRepoName: string;
  gitRepoOwner: string;
  gitRef: string;
  tempDirPath: string;
};

class CommandFinishedWithNonZeroCode extends buildTaggedErrorClassVerifyingCause<{
  exitCode: number;
  stdout: string;
  stderr: string;
}>()(
  'CommandFinishedWithNonZeroCode',
  'Error: Command finished with non zero code',
) {}

const Uint8ArrayStreamToString = <E, R>(
  stream: Stream<Uint8Array<ArrayBufferLike>, E, R>,
) =>
  stream.pipe(
    decodeText(),
    runFold('', (a, b) => a + b),
  );

const runCommandAndGetCommandOutputAndFailIfNonZeroCode = (
  command: PlatformCommand.Command,
) =>
  gen(function* () {
    const executor = yield* CommandExecutor;

    const process = yield* executor.start(command);

    const [exitCode, stdout, stderr] =
      yield* allWithInheritedConcurrencyByDefault([
        process.exitCode,
        Uint8ArrayStreamToString(process.stdout),
        Uint8ArrayStreamToString(process.stderr),
      ]);

    if (exitCode !== 0)
      yield* new CommandFinishedWithNonZeroCode({
        exitCode,
        stdout,
        stderr,
      });

    return {
      stdout,
      stderr,
    };
  });

const getPurelyContentDependentHashOfDirectory = (directoryPath: string) =>
  runCommandAndGetCommandOutputAndFailIfNonZeroCode(
    pipe(
      PlatformCommand.make(
        'tar',
        '--sort=name',
        '--mtime="@0"',
        '--owner=0',
        '--group=0',
        '--numeric-owner',
        '--pax-option=exthdr.name=%d/PaxHeaders/%f,delete=atime,delete=ctime,delete=mtime',
        '-cf',
        '-',
        '-C',
        directoryPath,
        '.',
      ),
      PlatformCommand.pipeTo(PlatformCommand.make('sha256sum')),
      PlatformCommand.pipeTo(PlatformCommand.make('head', '-c', '64')),
    ),
  ).pipe(map(v => v.stdout));

const bareCloneAndHashRepoContents = fn('bareCloneAndHashRepoContents')(
  function* ({ gitRepoName, gitRepoOwner, tempDirPath, gitRef }: Params) {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const entireGitRepoDestinationPath = path.join(
      tempDirPath,
      'originalGitRepo/',
    );

    yield* runCommandAndGetCommandOutputAndFailIfNonZeroCode(
      PlatformCommand.make(
        'git',
        'clone',
        '--depth=1',
        `https://github.com/${gitRepoOwner}/${gitRepoName}.git`,
        entireGitRepoDestinationPath,
      ),
    );

    yield* runCommandAndGetCommandOutputAndFailIfNonZeroCode(
      PlatformCommand.make('git', 'checkout', gitRef).pipe(
        PlatformCommand.workingDirectory(entireGitRepoDestinationPath),
      ),
    );

    yield* fs.remove(path.join(entireGitRepoDestinationPath, '.git'), {
      recursive: true,
    });

    return yield* getPurelyContentDependentHashOfDirectory(
      entireGitRepoDestinationPath,
    );
  },
);

const cliFetchAndHashRepoContents = fn('cliFetchAndHashRepoContents')(
  function* ({ gitRepoName, gitRepoOwner, tempDirPath, gitRef }: Params) {
    const path = yield* Path;
    const dirPathOfGitRepoFetchedWithOurCli = path.join(
      tempDirPath,
      'gitRepoFetchedWithOurCli/',
    );

    yield* cli([
      `--repoOwner=${gitRepoOwner}`,
      `--repoName=${gitRepoName}`,
      `--destinationPath=${dirPathOfGitRepoFetchedWithOurCli}`,
      `--gitRef=${gitRef}`,
    ]);

    return yield* getPurelyContentDependentHashOfDirectory(
      dirPathOfGitRepoFetchedWithOurCli,
    );
  },
);

const fetchAndHashBothDirs = fn('fetchAndHashBothDirs')(function* (
  repo: Omit<Params, 'tempDirPath'>,
) {
  const fs = yield* FileSystem;
  const tempDirPath = yield* fs.makeTempDirectoryScoped();
  const params = {
    ...repo,
    tempDirPath,
  };

  return yield* allWithInheritedConcurrencyByDefault({
    hashOfOriginalGitRepo: bareCloneAndHashRepoContents(params),
    hashOfGitRepoFetchedUsingOurCLI: cliFetchAndHashRepoContents(params),
  });
});

describe('CLI', { concurrent: true }, () => {
  // Commented because since the repo has big git lfs file, I quickly hit bandwidth limits

  // it.scoped(
  //   `Git Repo ${defaultRepo.owner}/${defaultRepo.name} (has git LFS objects in it) fetched by our cli, should be the same as repo cloned by git itself`,

  //   ctx =>
  //     gen(function* () {
  //       const { hashOfOriginalGitRepo, hashOfGitRepoFetchedUsingOurCLI } =
  //         yield* fetchAndHashBothDirs({
  //           gitRepoOwner: defaultRepo.owner,
  //           gitRepoName: defaultRepo.name,
  //           gitRef: 'main',
  //         });

  //       ctx
  //         .expect(
  //           hashOfGitRepoFetchedUsingOurCLI,
  //           `Hash of directory fetched by our CLI ("${hashOfGitRepoFetchedUsingOurCLI}") isn't equal to hash of directory cloned with native Git ("${hashOfOriginalGitRepo}"). Does your git client has git LFS activated?`,
  //         )
  //         .toBe(hashOfOriginalGitRepo);
  //     }).pipe(provide(MainLive)),
  //   { timeout: 0 /* long because of 100mb git LFS file  */ },
  // );

  it.scoped(
    'Git Repo nikelborm/nikelborm fetched by our cli, should be the same as repo cloned by git itself',
    ctx =>
      gen(function* () {
        const { hashOfOriginalGitRepo, hashOfGitRepoFetchedUsingOurCLI } =
          yield* fetchAndHashBothDirs({
            gitRepoOwner: 'nikelborm',
            gitRepoName: 'nikelborm',
            gitRef: 'main',
          });

        ctx
          .expect(
            hashOfGitRepoFetchedUsingOurCLI,
            `Hash of directory fetched by our CLI ("${hashOfGitRepoFetchedUsingOurCLI}") isn't equal to hash of directory cloned with native Git ("${hashOfOriginalGitRepo}"). Does your git client has git LFS activated?`,
          )
          .toBe(hashOfOriginalGitRepo);
      }).pipe(provide(MainLive)),
  );
});
