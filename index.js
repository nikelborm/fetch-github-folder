// @ts-check
'use strict';

import {
  downloadDirectoryRecursively,
  getEnvVarOrFail,
} from "./src/index.js";

await downloadDirectoryRecursively({
  githubAccessToken: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
  commitShaHashOrBranchNameOrTagName: process.env.COMMIT_SHA_HASH_OR_BRANCH_NAME_OR_TAG_NAME,
  repo: {
    owner: getEnvVarOrFail('GITHUB_REPO_OWNER'),
    name: getEnvVarOrFail('GITHUB_REPO_NAME'),
  },
  pathToParentDirectory: process.env.PATH_TO_PARENT_DIRECTORY || '',
  directoryName: getEnvVarOrFail('DIRECTORY_NAME'),
});
