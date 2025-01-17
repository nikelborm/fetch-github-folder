import { fail, gen } from 'effect/Effect';
import { pipe } from 'effect/Function';
import {
  getPathContentsMetaInfo,
  requestRawRepoPathContentsFromGitHubAPI,
} from './getPathContents/index.js';
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';
import { unpackRepoFolderTarGzStreamToFs } from './unpackRepoFolderTarGzStreamToFs.js';
import { writeFileStreamToDestinationPath } from './writeFileStreamToDestinationPath.js';

export const downloadEntityFromRepo = gen(function* () {
  const pathContentsMetaInfo = yield* getPathContentsMetaInfo;

  if (pathContentsMetaInfo.type === 'dir')
    return yield* pipe(
      getReadableTarGzStreamOfRepoDirectory(pathContentsMetaInfo.treeSha),
      unpackRepoFolderTarGzStreamToFs,
    );

  if (
    pathContentsMetaInfo.meta ===
    'This file is small enough that GitHub API decided to inline it'
  )
    return yield* pipe(
      pathContentsMetaInfo.contentStream,
      writeFileStreamToDestinationPath,
    );

  if (
    pathContentsMetaInfo.meta === 'This file can be downloaded as a blob'
  )
    return yield* pipe(
      requestRawRepoPathContentsFromGitHubAPI,
      writeFileStreamToDestinationPath,
    );

  yield* fail(new Error('LFS files are not yet supported'));
});
