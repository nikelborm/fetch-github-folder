import { ParseToReadableStream } from '../parseToReadableStream.js';
import { requestRepoPathContentsFromGitHubAPI } from './requestRepoPathContentsFromGitHubAPI.js';

export const requestRawRepoPathContentsFromGitHubAPI =
  ParseToReadableStream(requestRepoPathContentsFromGitHubAPI('raw', true));
