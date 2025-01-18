import { CastToReadableStream } from '../castToReadableStream.js';
import { RepoPathContentsFromGitHubAPI } from './requestRepoPathContentsFromGitHubAPI.js';

export const RawStreamOfRepoPathContentsFromGitHubAPI =
  CastToReadableStream(RepoPathContentsFromGitHubAPI('raw', true));
