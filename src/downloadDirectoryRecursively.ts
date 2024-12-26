import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import path from 'path';
import tarFs from 'tar-fs';
import { downloadDirectoryContentsMetaInfo } from "./downloadDirectoryContentsMetaInfo.js";
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';

export async function downloadDirectoryRecursively({
  repo,
  pathToDirectoryInRepo,
  commitShaHashOrBranchNameOrTagName,
  pathToLocalDirIntoWhichContentsOfRepoDirWillBePut,
}: {
  repo: {
    owner: string,
    name: string
  },
  pathToDirectoryInRepo: string,
  pathToLocalDirIntoWhichContentsOfRepoDirWillBePut: string,
  commitShaHashOrBranchNameOrTagName?: string | undefined,
}) {
  const directoriesInPath = path
    .join(pathToDirectoryInRepo) // cleans up the path of stupid shit
    .replace(/\/*$/, '') // remove trailing slash
    .split('/');

  // few options generally present in directoriesInPath: [nonEmptyString],
  // [nonEmptyString, nonEmptyString, ...nonEmptyString[]], and ['.']

  if (directoriesInPath[0] === '..') throw new Error(
    `Can't go to parent folder like that: ${pathToDirectoryInRepo}`
  );

  const target =
    directoriesInPath['length'] === 1 && directoriesInPath[0] === '.'
      ? { directoryToDownload: 'root' as const }
      : directoriesInPath['length'] === 1
      ? {
        directoryToDownload: 'dirDirectlyInRoot' as const,
        directoryName: directoriesInPath[0] as string
      }
      : directoriesInPath['length'] > 1
      ? {
        directoryToDownload: 'nestedDir' as const,
        directoryName: directoriesInPath.at(-1) as string,
        pathToParentDirectory: directoriesInPath
          .slice(0, -1) // takes everything except last one
          .join('/'),
      }
      : (() => { throw new Error('Impossible directoriesInPath.length === 0') })();

  let gitRef = commitShaHashOrBranchNameOrTagName || 'HEAD'

  if (target.directoryToDownload !== 'root') {
    const pathToDirectory = target.directoryToDownload === 'dirDirectlyInRoot'
      ? "."
      : target.pathToParentDirectory;

    const parentDirectoryContentsMetaInfo = await downloadDirectoryContentsMetaInfo({
      repo,
      gitRef,
      pathToDirectory,
    });

    const dirElement = parentDirectoryContentsMetaInfo.find(
      ({ name }) => name === target.directoryName,
    );

    const fullPathOfDownloadableDirectory = path.join(
      pathToDirectory,
      target.directoryName
    );

    if (!dirElement)
      throw new Error(`${fullPathOfDownloadableDirectory} does not exist.`);

    if (dirElement.type !== 'dir')
      throw new Error(`${fullPathOfDownloadableDirectory} is not a directory`);

    gitRef = dirElement.sha;
  }

  await pipeline(
    await getReadableTarGzStreamOfRepoDirectory(repo, gitRef),
    createGunzip(),
    tarFs.extract(pathToLocalDirIntoWhichContentsOfRepoDirWillBePut, {
      map: (header) => {
        // GitHub creates archive with nested dir inside that has all the
        // files we need, so we remove this dir's name from the beginning
        header.name = header.name.replace(/^[^/]*\/(.*)/, '$1');
        return header;
      }
    })
  );
}
