import { Path } from "@effect/platform/Path";
import {
  fail,
  flatten,
  gen,
  succeed,
  type Effect
} from 'effect/Effect';
import { downloadPathContentsMetaInfo } from './downloadPathContentsMetaInfo.js';
import { Repo } from './repo.interface.js';
import type { RequestError } from '@octokit/request-error';
import type { UnknownException } from 'effect/Cause';
import type { OctokitTag } from './octokit.js';

export const getGitTreeRefFromParentTreeRef = ({
  repo,
  parentGitRef,
  cleanPath,
}: {
  repo: Repo,
  cleanPath: string,
  parentGitRef: string,
}): Effect<
  string,
  RequestError | Error | UnknownException,
  OctokitTag | Path
> => gen(function* () {
  const path = yield* Path;

  const parentDirectoryContentsMetaInfo = yield* downloadPathContentsMetaInfo({
    repo,
    gitRef: parentGitRef,
    path: path.dirname(cleanPath),
  });

  const childDirectoryName = path.basename(cleanPath);

  // TODO: check for collisions if there will be different directories with the same name
  // @ts-ignore
  const dirElement = parentDirectoryContentsMetaInfo.find(
    // @ts-ignore
    ({ name }) => name === childDirectoryName,
  );

  if (!dirElement)
    return fail(new Error(`${cleanPath} does not exist.`));

  if (dirElement.type !== 'dir')
    return fail(new Error(`${cleanPath} is not a directory.`));

  const childTreeRef = dirElement.sha

  return succeed(childTreeRef);
}).pipe(flatten)
