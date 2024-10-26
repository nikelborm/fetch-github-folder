import { octokit } from './octokit.js';

export async function downloadInfoAboutAllBlobsInDirectory({
  repo,
  gitTreeShaHashOfDirectory,
}: {
  repo: {
    owner: string,
    name: string
  },
  gitTreeShaHashOfDirectory: string,
}) {
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

  // TODO: check if it's a directory I guess

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
