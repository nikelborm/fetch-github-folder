import path from 'path';
import { downloadDirectoryContentsMetaInfo } from './downloadDirectoryContentsMetaInfo.js';
import { Repo } from './repo.interface.js';

export async function getGitTreeRefFromParentTreeRef({
  repo,
  parentDirectoryPath,
  parentGitRef,
  childDirectoryName,
}: {
  repo: Repo,
  parentDirectoryPath: string,
  childDirectoryName: string,
  parentGitRef: string,
}): Promise<string> {
  const parentDirectoryContentsMetaInfo = await downloadDirectoryContentsMetaInfo({
    repo,
    gitRef: parentGitRef,
    pathToDirectory: parentDirectoryPath,
  });

  const dirElement = parentDirectoryContentsMetaInfo.find(
    ({ name }) => name === childDirectoryName,
  );

  const fullPathOfDownloadableDirectory = path.join(
    parentDirectoryPath,
    childDirectoryName
  );

  if (!dirElement)
    throw new Error(`${fullPathOfDownloadableDirectory} does not exist.`);

  if (dirElement.type !== 'dir')
    throw new Error(`${fullPathOfDownloadableDirectory} is not a directory`);

  const childTreeRef = dirElement.sha

  return childTreeRef;
}
