import fs from 'fs/promises';
import path from 'path';
import { downloadDirectoryContentsMetaInfo } from "./downloadDirectoryContentsMetaInfo";
import { downloadInfoAboutAllBlobsInDirectory } from "./downloadInfoAboutAllBlobsInDirectory";

export async function downloadDirectoryRecursively({
  githubAccessToken,
  repo,
  pathToDirectoryInRepo,
  commitShaHashOrBranchNameOrTagName,
  pathToLocalDirContentsOfRepoDirWillBePutInto,
}: {
  githubAccessToken: string,
  repo: {
    owner: string,
    name: string
  },
  pathToDirectoryInRepo: string,
  pathToLocalDirContentsOfRepoDirWillBePutInto: string,
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

  const infoAboutDownloadableDirectory =
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

  let gitTreeShaHashOfDirectory =
    infoAboutDownloadableDirectory.directoryToDownload === 'root'
      ? commitShaHashOrBranchNameOrTagName || 'HEAD'
      : await (async () => {
        const pathToDirectory = infoAboutDownloadableDirectory.directoryToDownload === 'dirDirectlyInRoot'
          ? "."
          : infoAboutDownloadableDirectory.pathToParentDirectory;

        const parentDirectoryContentsMetaInfo = await downloadDirectoryContentsMetaInfo({
          githubAccessToken,
          repo,
          commitShaHashOrBranchNameOrTagName: commitShaHashOrBranchNameOrTagName || 'HEAD',
          pathToDirectory,
        });

        const dirElement = parentDirectoryContentsMetaInfo.find(
          ({ name }) => name === infoAboutDownloadableDirectory.directoryName,
        );

        const fullPathOfDownloadableDirectory = path.join(
          pathToDirectory,
          infoAboutDownloadableDirectory.directoryName
        );

        if (!dirElement)
          throw new Error(`${fullPathOfDownloadableDirectory} does not exist.`);

        if (dirElement.type !== 'dir')
          throw new Error(`${fullPathOfDownloadableDirectory} is not a directory`);

        return dirElement.sha;
      })()

  const blobs = await downloadInfoAboutAllBlobsInDirectory({
    githubAccessToken,
    repo,
    gitTreeShaHashOfDirectory
  });
  console.table(blobs);

  await Promise.all(
    blobs.map(async ({ url, pathInsideDirectory }) => {
      const relativePathWhereToSaveFile = path.join(
        pathToLocalDirContentsOfRepoDirWillBePutInto,
        pathInsideDirectory
      );

      const response = await fetch(url);
      // @ts-ignore
      const { content } = await response.json();

      if (!content)
        throw new Error(`Blob ${pathInsideDirectory} does not have content`);

      await fs.mkdir(
        path.dirname(relativePathWhereToSaveFile),
        { recursive: true }
      );

      await fs.writeFile(
        relativePathWhereToSaveFile,
        Buffer.from(content, 'base64'),
      );
    })
  )
}
