// @ts-check
'use strict';
import { Octokit } from "@octokit/core";

/**
* @param {{
*   githubAccessToken: string,
*   repo: {
*     owner: string,
*     name: string
*   },
*   gitTreeShaHashOfDirectory: string,
* }} param0
*/
export async function downloadInfoAboutAllBlobsInDirectory({
  githubAccessToken,
  repo,
  gitTreeShaHashOfDirectory,
}) {
  const octokit = new Octokit({
    auth: githubAccessToken
  });

  const { data: { tree: flatTreeOfDirectory } } = await octokit.request(
    'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
    {
      owner: repo.owner,
      repo: repo.name,
      tree_sha: gitTreeShaHashOfDirectory,
      recursive: 'true',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
    }
  );

  const blobs = flatTreeOfDirectory
    .filter(({ type }) => type === 'blob')
    .map(({ url, path: pathInsideDirectory }) => {
      if (!pathInsideDirectory)
        throw new Error(`Blob does not have a path`);

      if (!url)
        throw new Error(`Blob does not have a url`);

      return { pathInsideDirectory, url };
    });

  return blobs;
}
