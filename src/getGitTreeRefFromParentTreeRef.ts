import { Path } from "@effect/platform/Path";
import type { RequestError } from '@octokit/request-error';
import type { UnknownException } from 'effect/Cause';
import { fail, gen, type Effect } from 'effect/Effect';
import { getPathContentsMetaInfo } from './downloadPathContentsMetaInfo.js';
import type { OctokitTag } from './octokit.js';
import { Repo } from './repo.interface.js';
import { TaggedErrorVerifyingCause } from './TaggedErrorVerifyingCause.js';


// : Effect<
//   string,
//   RequestError | Error | UnknownException,
//   OctokitTag | Path
// >

export const getGitTreeRefFromParentTreeRef = ({
  repo,
  parentGitRef,
  cleanPath,
}: {
  repo: Repo,
  cleanPath: string,
  parentGitRef: string,
}) => gen(function* () {
  const path = yield* Path;

  const parentDirectoryContentsMetaInfo = yield* getPathContentsMetaInfo({
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
    return yield* new PathInsideTheRepoDoesNotExist({
      path: cleanPath
    });

  if (dirElement.type !== 'dir')
    return yield* new PathInsideOTheRepoIsNotADirectory({
      path: cleanPath
    });

  const childTreeRef = dirElement.sha

  return childTreeRef;
})


export class PathInsideTheRepoDoesNotExist extends TaggedErrorVerifyingCause<{
  path: string
}>()(
  'PathInsideOfTheRepoDoesNotExist',
  (ctx) => `${ctx.path} does not exist.`,
) {}

export class PathInsideOTheRepoIsNotADirectory extends TaggedErrorVerifyingCause<{
  path: string
}>()(
  'PathInsideOTheRepoIsNotADirectory',
  (ctx) => `${ctx.path} is not a directory.`,
) {}
