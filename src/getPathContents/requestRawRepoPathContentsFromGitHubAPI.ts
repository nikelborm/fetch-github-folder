import { CastToReadableStream } from '../castToReadableStream.js';
import { requestRepoPathContentsFromGitHubAPI } from './requestRepoPathContentsFromGitHubAPI.js';

export const requestRawRepoPathContentsFromGitHubAPI =
  CastToReadableStream(requestRepoPathContentsFromGitHubAPI('raw', true));
