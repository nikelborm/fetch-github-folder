#!/usr/bin/env node

import { text, withDescription, withDefault } from '@effect/cli/Args';
import { make, run } from '@effect/cli/Command';
import { layer as NodeFileSystemLayer } from '@effect/platform-node/NodeFileSystem';
import { layer as NodePathLayer } from '@effect/platform-node/NodePath';
import { layer as NodeTerminalLayer } from '@effect/platform-node/NodeTerminal';
import { runMain } from '@effect/platform-node/NodeRuntime';
import { Octokit as OctokitClient } from '@octokit/core';
import { pipe } from 'effect/Function';
import { provide, provideService } from 'effect/Effect';
import { downloadDirAndPutIntoFs, OctokitTag } from "./src/index.js";

// Those values updated automatically. If you edit names of constants or
// move them to a different file, update ./scripts/build.sh
const PACKAGE_VERSION = "0.1.5";
const PACKAGE_NAME = "fetch-github-folder";

const pathToDirectoryInRepo = pipe(
  text({ name: 'pathToDirectoryInRepo' }),
  withDescription("Path to directory in repo"),
);

const repoOwner = pipe(
  text({ name: "repoOwner" }),
  withDescription("Repo owner's username"),
);

const repoName = pipe(
  text({ name: "repoName" }),
  withDescription("Repo's name"),
);

const localDirPathToPutInsideRepoDirContents = pipe(
  text({ name: "localDirPathToPutInsideRepoDirContents" }),
  withDescription("Local dir path to put inside repo dir contents"),
);

const gitRef = pipe(
  text({ name: "gitRef" }),
  withDefault('HEAD'),
  withDescription("Commit sha hash or branch name or tag name"),
);

const appCommand = make("fetch-github-folder", {
  repoOwner,
  repoName,
  pathToDirectoryInRepo,
  localDirPathToPutInsideRepoDirContents,
  gitRef,
}, (x) =>
  downloadDirAndPutIntoFs({
    repo: {
      owner: x.repoOwner,
      name: x.repoName,
    },
    pathToDirectoryInRepo: x.pathToDirectoryInRepo,
    localDirPathToPutInsideRepoDirContents:
      x.localDirPathToPutInsideRepoDirContents,
    gitRef: x.gitRef,
  })
);


const cli = run(appCommand, {
  // those values will be filled automatically from package.json
  name: PACKAGE_NAME,
  version: PACKAGE_VERSION,
});


pipe(
  process.argv,
  cli,
  provide(NodeFileSystemLayer),
  provide(NodePathLayer),
  provide(NodeTerminalLayer),
  provideService(OctokitTag, new OctokitClient({
    // auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
  })),
  runMain
);
