import { Readable } from 'stream';
import { octokit } from './octokit.js';

export async function getReadableTarGzStreamOfRepoDirectory(
  repo: {
    owner: string,
    name: string
  },
  gitRef: string
) {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
    owner: repo.owner,
    repo: repo.name,
    ref: gitRef,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }) as { data: ArrayBuffer }// tar.gz

  return new Readable({
    read() {
      this.push(Buffer.from(data));
      this.push(null);
    }
  })
}
