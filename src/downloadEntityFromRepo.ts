import { Effect, fail, gen, succeed, tryPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { OutputConfigTag } from './config.js';
import { getPathContentsMetaInfo, requestRawRepoPathContentsFromGitHubAPI } from './getPathContents/index.js';
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';
import { unpackRepoFolderTarGzStreamToFs } from './unpackRepoFolderTarGzStreamToFs.js';

export const downloadEntityFromRepo = gen(function* () {
  const pathContentsMetaInfo = yield* getPathContentsMetaInfo;

  if (pathContentsMetaInfo.type === 'dir')
    return yield* pipe(
      getReadableTarGzStreamOfRepoDirectory(
        pathContentsMetaInfo.treeSha
      ),
      unpackRepoFolderTarGzStreamToFs,
    );

  if (pathContentsMetaInfo.meta === 'This file is small enough that GitHub API decided to inline it')
    return yield* pipe(
      succeed(pathContentsMetaInfo.content),
      DownloadAndWriteFileToFs
    );

  if (pathContentsMetaInfo.meta === 'This file can be downloaded as a blob')
    return yield* pipe(
      requestRawRepoPathContentsFromGitHubAPI,
      DownloadAndWriteFileToFs,
    );

  yield* fail(new Error('LFS files are not yet supported'))
})


export const DownloadAndWriteFileToFs = <E, R>(
  self: Effect<Readable, E, R>
) => gen(function* () {
  const fileStream = yield* self;

  const {
    localPathAtWhichEntityFromRepoWillBeAvailable:
      localDownloadedFilePath
  } = yield* OutputConfigTag;

  return yield* tryPromise({
    try: (signal) => pipeline(
      fileStream,
      createWriteStream(localDownloadedFilePath),
      { signal }
    ),
    catch: (error) => new Error(
      'Failed blablabla',
      { cause: error }
    )
  })
})
