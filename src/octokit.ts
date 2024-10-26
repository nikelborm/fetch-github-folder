import { Octokit } from '@octokit/core';
import { getEnvVarOrFail } from './getEnvVarOrFail.js';

export const octokit = new Octokit({
  auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
});
