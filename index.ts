import {
  downloadDirectoryRecursively,
  getEnvVarOrFail,
} from "./src/index.js";

await downloadDirectoryRecursively({
  repo: {
    owner: getEnvVarOrFail('GITHUB_REPO_OWNER'),
    name: getEnvVarOrFail('GITHUB_REPO_NAME'),
  },
  pathToDirectoryInRepo: getEnvVarOrFail('PATH_TO_DIRECTORY_IN_REPO'),
  pathToLocalDirContentsOfRepoDirWillBePutInto: getEnvVarOrFail('PATH_TO_LOCAL_DIR_CONTENTS_OF_REPO_DIR_WILL_BE_PUT_INTO'),
  commitShaHashOrBranchNameOrTagName: process.env['COMMIT_SHA_HASH_OR_BRANCH_NAME_OR_TAG_NAME'],
});