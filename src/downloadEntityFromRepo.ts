import { fail, gen } from 'effect/Effect';
import {
  PathContentsMetaInfo,
  RawStreamOfRepoPathContentsFromGitHubAPI,
} from './getPathContents/index.js';
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';
import { unpackRepoFolderTarGzStreamToFs } from './unpackRepoFolderTarGzStreamToFs.js';
import { writeFileStreamToDestinationPath } from './writeFileStreamToDestinationPath.js';

export const downloadEntityFromRepo = gen(function* () {
  const pathContentsMetaInfo = yield* PathContentsMetaInfo;

  if (pathContentsMetaInfo.type === 'dir')
    return yield* unpackRepoFolderTarGzStreamToFs(
      getReadableTarGzStreamOfRepoDirectory(pathContentsMetaInfo.treeSha),
    );

  if (
    pathContentsMetaInfo.meta ===
    'This file is small enough that GitHub API decided to inline it'
  )
    return yield* writeFileStreamToDestinationPath(
      pathContentsMetaInfo.contentStream,
    );

  if (pathContentsMetaInfo.meta === 'This file can be downloaded as a blob')
    return yield* writeFileStreamToDestinationPath(
      RawStreamOfRepoPathContentsFromGitHubAPI,
    );

  yield* fail(new Error('LFS files are not yet supported'));
});
