import { Effect as E, pipe } from 'effect';
import { Path } from "@effect/platform";
import { downloadDirectoryContentsMetaInfo } from './downloadDirectoryContentsMetaInfo.js';
import { Repo } from './repo.interface.js';

export const getGitTreeRefFromParentTreeRef = ({
  repo,
  parentGitRef,
  cleanPath,
}: {
  repo: Repo,
  cleanPath: string,
  parentGitRef: string,
}) => E.gen(function* () {
  const path = yield* Path.Path;

  const parentDirectoryContentsMetaInfo = yield* downloadDirectoryContentsMetaInfo({
    repo,
    gitRef: parentGitRef,
    pathToDirectory: path.dirname(cleanPath),
  });

  const childDirectoryName = path.basename(cleanPath);

  // TODO: check for collisions if there will be different directories with the same name
  const dirElement = parentDirectoryContentsMetaInfo.find(
    ({ name }) => name === childDirectoryName,
  );

  if (!dirElement)
    return E.fail(new Error(`${cleanPath} does not exist.`));

  if (dirElement.type !== 'dir')
    return E.fail(new Error(`${cleanPath} is not a directory.`));

  const childTreeRef = dirElement.sha

  return E.succeed(childTreeRef);
}).pipe(E.flatten)
