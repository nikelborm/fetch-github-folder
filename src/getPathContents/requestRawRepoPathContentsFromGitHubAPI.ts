import { pipe } from 'effect';
import { ParseToReadableStream } from 'src/parseToReadableStream.js';
import { Repo } from '../repo.interface.js';
import { requestRepoPathContentsFromGitHubAPI } from './requestRepoPathContentsFromGitHubAPI.js';

export const requestRawRepoPathContentsFromGitHubAPI = ({
  repo,
  gitRef,
  path
}: {
  repo: Repo,
  path: string,
  gitRef?: string | undefined,
}) => ParseToReadableStream(
  requestRepoPathContentsFromGitHubAPI({
    repo,
    gitRef,
    format: "raw",
    streamBody: true,
    path
  })
);
