import { octokit } from './octokit.js';

export async function downloadDirectoryContentsMetaInfo({
  repo,
  commitShaHashOrBranchNameOrTagName,
  pathToDirectory
}: {
  repo: {
    owner: string,
    name: string
  },
  pathToDirectory: string,
  commitShaHashOrBranchNameOrTagName: string,
}) {
  const { data: contentsOfDirectory } = await octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    {
      owner: repo.owner,
      repo: repo.name,
      path: pathToDirectory,
      ref: commitShaHashOrBranchNameOrTagName,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
    }
  );

  // TODO: try, catch and explain 404 normally

  if (!Array.isArray(contentsOfDirectory))
    throw new Error(`${pathToDirectory} is not a directory`);

  return contentsOfDirectory
}
