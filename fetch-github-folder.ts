#!/usr/bin/env node

import "@total-typescript/ts-reset";

import { Args, Command } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Octokit as OctokitClient } from '@octokit/core';
import { pipe } from 'effect';
import { provide, provideService } from 'effect/Effect';
import { downloadDirAndPutIntoFs, OctokitTag } from "./src/index.js";

// Those values updated automatically. If you edit names of constants or
// move them to a different file, update ./scripts/build.sh
const PACKAGE_VERSION = "0.1.4";
const PACKAGE_NAME = "fetch-github-folder";

const pathToDirectoryInRepo = pipe(
  Args.text({ name: 'pathToDirectoryInRepo' }),
  Args.withDescription("Path to directory in repo"),
);

const repoOwner = pipe(
  Args.text({ name: "repoOwner" }),
  Args.withDescription("Repo owner's username"),
);

const repoName = pipe(
  Args.text({ name: "repoName" }),
  Args.withDescription("Repo's name"),
);

const localDirPathToPutInsideRepoDirContents = pipe(
  Args.path({ name: "localDirPathToPutInsideRepoDirContents" }),
  Args.withDescription("Local dir path to put inside repo dir contents"),
);

const gitRef = pipe(
  Args.text({ name: "gitRef" }),
  Args.withDefault('HEAD'),
  Args.withDescription("Commit sha hash or branch name or tag name"),
);

const appCommand = Command.make("fetch-github-folder", {
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


const cli = Command.run(appCommand, {
  // those values will be filled automatically from package.json
  name: PACKAGE_NAME,
  version: PACKAGE_VERSION,
});


pipe(
  process.argv,
  cli,
  provide(NodeContext.layer),
  provideService(OctokitTag, new OctokitClient({
    // auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
  })),
  NodeRuntime.runMain
);
