import { Command as CliCommand } from '@effect/cli';
import { nonEmptyString, withDefault } from 'effect/Config';
import { Command as PlatformCommand } from '@effect/platform';
import {
  NodeCommandExecutor,
  NodeFileSystem,
  NodePath,
  NodeTerminal,
} from '@effect/platform-node';
import { FileSystem } from '@effect/platform/FileSystem';
import { Path } from '@effect/platform/Path';
import { describe, it } from '@effect/vitest';
import { pipe } from 'effect';
import { all, fn, gen, provide } from 'effect/Effect';
import { mergeAll, provideMerge } from 'effect/Layer';
import {
  destinationPathCLIOptionBackedByEnv,
  downloadEntityFromRepo,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
  pathToEntityInRepoCLIOptionBackedByEnv,
  provideSingleDownloadTargetConfig,
  repoNameCLIOptionBackedByEnv,
  repoOwnerCLIOptionBackedByEnv,
} from './src/index.js';

const defaultRepo = {
  owner: 'fetch-gh-folder-tests',
  name: 'public-repo',
};

const getPurelyContentDependentHashOfDirectory = (directoryPath: string) =>
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
    PlatformCommand.string,
  );

const DestinationPathConfig = pipe(
  nonEmptyString('TMPDIR'),
  withDefault('/tmp'),
);

const appCommand = CliCommand.make(
  'fetch-github-folder',
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
  config =>
    downloadEntityFromRepo.pipe(provideSingleDownloadTargetConfig(config)),
);

const cli = (args: ReadonlyArray<string>) =>
  CliCommand.run(appCommand, {
    // those values will be filled automatically from package.json
    name: 'fetch-github-folder-test',
    version: '0.0.1-dev',
  })([
    '/home/nikel/.nvm/versions/node/v23.3.0/bin/node',
    './fetch-github-folder-test.ts',
    ...args,
  ]);

const MainLive = mergeAll(
  NodePath.layer,
  NodeTerminal.layer,
  NodeCommandExecutor.layer,
  OctokitLayer(),
  // setConsole(console),
).pipe(provideMerge(NodeFileSystem.layer));

type Params = {
  gitRepoName: string;
  gitRepoOwner: string;
  gitRef: string;
  tempDirPath: string;
};

const bareCloneAndHashRepoContents = fn('bareCloneAndHashRepoContents')(
  function* ({ gitRepoName, gitRepoOwner, tempDirPath, gitRef }: Params) {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const entireGitRepoDestinationPath = path.join(
      tempDirPath,
      'originalGitRepo/',
    );

    yield* PlatformCommand.make(
      'git',
      'clone',
      '--depth=1',
      `git@github.com:${gitRepoOwner}/${gitRepoName}.git`,
      entireGitRepoDestinationPath,
    ).pipe(PlatformCommand.string);

    yield* PlatformCommand.make('git', 'checkout', gitRef).pipe(
      PlatformCommand.workingDirectory(entireGitRepoDestinationPath),
      PlatformCommand.string,
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
  const prefix = yield* DestinationPathConfig;
  const tempDirPath = yield* fs.makeTempDirectoryScoped({ prefix });
  const params = {
    ...repo,
    tempDirPath,
  };

  return yield* all(
    {
      hashOfOriginalGitRepo: bareCloneAndHashRepoContents(params),
      hashOfGitRepoFetchedUsingOurCLI: cliFetchAndHashRepoContents(params),
    },
    { concurrency: 'unbounded' },
  );
});

describe('fetch-github-folder-cli', { concurrent: true }, () => {
  it.scoped(
    `Git Repo ${defaultRepo.owner}/${defaultRepo.name} fetched by our cli, should be the same as repo cloned by git itself`,

    ctx =>
      gen(function* () {
        const { hashOfOriginalGitRepo, hashOfGitRepoFetchedUsingOurCLI } =
          yield* fetchAndHashBothDirs({
            gitRepoOwner: defaultRepo.owner,
            gitRepoName: defaultRepo.name,
            gitRef: 'main',
          });

        ctx
          .expect(
            hashOfGitRepoFetchedUsingOurCLI,
            `Hash of directory fetched by our CLI ("${hashOfGitRepoFetchedUsingOurCLI}") isn't equal to hash of directory cloned with native Git ("${hashOfOriginalGitRepo}"). Does your git client has git LFS activated?`,
          )
          .toBe(hashOfOriginalGitRepo);
      }).pipe(provide(MainLive)),
    { timeout: 0 /* long because of 100mb git LFS file  */ },
  );

  it.scoped(
    `Git Repo nikelborm/nikelborm fetched by our cli, should be the same as repo cloned by git itself`,
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
