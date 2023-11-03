// @ts-check
'use strict';

import {
  downloadDirectoryRecursively,
  getEnvVarOrFail,
} from "./src/index.js";

await downloadDirectoryRecursively({
  githubAccessToken: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
  repo: {
    owner: getEnvVarOrFail('GITHUB_REPO_OWNER'),
    name: getEnvVarOrFail('GITHUB_REPO_NAME'),
  },
  pathToDirectoryInRepo: getEnvVarOrFail('PATH_TO_DIRECTORY_IN_REPO'),
  commitShaHashOrBranchNameOrTagName: process.env.COMMIT_SHA_HASH_OR_BRANCH_NAME_OR_TAG_NAME,
});
