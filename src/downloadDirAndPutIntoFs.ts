import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import path from 'path';
import tarFs from 'tar-fs';
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.js';
import { getGitTreeRefFromParentTreeRef } from './getGitTreeRefFromParentTreeRef.js';
import { Repo } from './repo.interface.js';

export async function downloadDirAndPutIntoFs({
  repo,
  pathToDirectoryInRepo,
  commitShaHashOrBranchNameOrTagName,
  localDirPathToPutInsideRepoDirContents,
}: {
  repo: Repo,
  pathToDirectoryInRepo: string,
  localDirPathToPutInsideRepoDirContents: string,
  commitShaHashOrBranchNameOrTagName?: string | undefined,
}) {
  const directoriesInPath = path
    .join(pathToDirectoryInRepo) // cleans up the path of stupid shit, also removes ./ in the beginning
    .replace(/\/*$/, '') // removes trailing slash
    .split('/');

  // few options generally present in directoriesInPath: [nonEmptyString],
  // [nonEmptyString, nonEmptyString, ...nonEmptyString[]], and ['.']

  if (directoriesInPath[0] === '..') throw new Error(
    `Can't go to parent folder like that: ${pathToDirectoryInRepo}`
  );

  let gitRef = commitShaHashOrBranchNameOrTagName || 'HEAD'

  // '.' can only be there only when that's all there is. path.join(...)
  // removes all './', so '.' will never be just left. If it's there, it's
  // very intentional and no other elements in the path exist.
  if (directoriesInPath[0] !== '.') {
    const parentDirectoryPathElements = [...directoriesInPath];
    const childDirectoryName = parentDirectoryPathElements.pop()!;

    gitRef = await getGitTreeRefFromParentTreeRef({
      parentDirectoryPath: parentDirectoryPathElements.join('/') || '.',
      childDirectoryName,
      parentGitRef: gitRef,
      repo,
    });
  }

  await pipeline(
    await getReadableTarGzStreamOfRepoDirectory(repo, gitRef),
    createGunzip(),
    tarFs.extract(localDirPathToPutInsideRepoDirContents, {
      map: (header) => {
        // GitHub creates archive with nested dir inside that has all the
        // files we need, so we remove this dir's name from the beginning
        header.name = header.name.replace(/^[^/]*\/(.*)/, '$1');
        return header;
      }
    })
  );
}
