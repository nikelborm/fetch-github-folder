import { Effect as E, pipe } from 'effect';
import { Path } from "@effect/platform";
import { downloadDirectoryContentsMetaInfo } from './downloadDirectoryContentsMetaInfo.js';
import { Repo } from './repo.interface.js';

export const getGitTreeRefFromParentTreeRef = ({
  repo,
  parentDirectoryPath,
  parentGitRef,
  childDirectoryName,
}: {
  repo: Repo,
  parentDirectoryPath: string,
  childDirectoryName: string,
  parentGitRef: string,
}) => pipe(
  E.all([
    Path.Path,
    downloadDirectoryContentsMetaInfo({
      repo,
      gitRef: parentGitRef,
      pathToDirectory: parentDirectoryPath,
    })
  ]),
  E.flatMap(([path, parentDirectoryContentsMetaInfo]) => {
    const dirElement = parentDirectoryContentsMetaInfo.find(
      ({ name }) => name === childDirectoryName,
    );

    const fullPathOfDownloadableDirectory = path.join(
      parentDirectoryPath,
      childDirectoryName
    );

    if (!dirElement)
      return E.fail(new Error(`${fullPathOfDownloadableDirectory} does not exist.`));

    if (dirElement.type !== 'dir')
      return E.fail(new Error(`${fullPathOfDownloadableDirectory} is not a directory.`));

    const childTreeRef = dirElement.sha

    return E.succeed(childTreeRef);
  }),
);
