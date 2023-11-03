// @ts-check
'use strict';

import fs from 'fs/promises';
import path from 'path';
import { downloadDirectoryContentsMetaInfo } from "./downloadDirectoryContentsMetaInfo.js";
import { downloadInfoAboutAllBlobsInDirectory } from "./downloadInfoAboutAllBlobsInDirectory.js";

/**
* @param {{
*   githubAccessToken: string,
*   repo: {
*     owner: string,
*     name: string
*   },
*   directoryName: string,
*   pathToParentDirectory?: string
*   commitShaHashOrBranchNameOrTagName?: string,
* }} param0
*/
export async function downloadDirectoryRecursively({
  githubAccessToken,
  repo,
  directoryName,
  commitShaHashOrBranchNameOrTagName,
  pathToParentDirectory = ''
}) {
  const parentDirectoryContentsMetaInfo = await downloadDirectoryContentsMetaInfo({
    githubAccessToken,
    repo,
    commitShaHashOrBranchNameOrTagName,
    pathToDirectory: pathToParentDirectory
  });

  const dirElement = parentDirectoryContentsMetaInfo.find(
    ({ name }) => name === directoryName,
  );

  if (!dirElement)
    throw new Error(`${directoryName} does not exist inside ${pathToParentDirectory || 'root directory'}`);

  if (dirElement.type !== 'dir')
    throw new Error(`${path.join(pathToParentDirectory, directoryName)} is not a directory`);

  const blobs = await downloadInfoAboutAllBlobsInDirectory({
    githubAccessToken,
    repo,
    gitTreeShaHashOfDirectory: dirElement.sha,
  });
  console.table(blobs);

  await Promise.all(
    blobs.map(async ({ url, pathInsideDirectory }) => {
      const relativePathWhereToSaveFile = path.join('./', pathToParentDirectory, directoryName, pathInsideDirectory);

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
