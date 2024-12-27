#!/usr/bin/env node

import {
  downloadDirAndPutIntoFs,
  getEnvVarOrFail
} from "./src/index.js";

await downloadDirAndPutIntoFs({
  repo: {
    owner: getEnvVarOrFail('GITHUB_REPO_OWNER'),
    name: getEnvVarOrFail('GITHUB_REPO_NAME'),
  },
  pathToDirectoryInRepo: getEnvVarOrFail('PATH_TO_DIRECTORY_IN_REPO'),
  localDirPathToPutInsideRepoDirContents:
    getEnvVarOrFail('LOCAL_DIR_PATH_TO_PUT_INSIDE_REPO_DIR_CONTENTS'),
  commitShaHashOrBranchNameOrTagName: process.env['COMMIT_SHA_HASH_OR_BRANCH_NAME_OR_TAG_NAME'],
});
