import { CastToReadableStream } from '../castToReadableStream.js';
import { RepoPathContentsFromGitHubAPI } from './RepoPathContentsFromGitHubAPI.js';

export const RawStreamOfRepoPathContentsFromGitHubAPI = CastToReadableStream(
  RepoPathContentsFromGitHubAPI('raw', true),
);
