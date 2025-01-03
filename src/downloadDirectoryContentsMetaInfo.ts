import { RequestError } from "@octokit/request-error";
import { pipe } from 'effect/Function';
import { UnknownException } from 'effect/Cause';
import {
  fail,
  flatMap,
  succeed,
  tryMapPromise,
} from 'effect/Effect';
import { OctokitTag } from './octokit.js';
import { Repo } from './repo.interface.js';

export const downloadDirectoryContentsMetaInfo = ({
  repo,
  gitRef,
  pathToDirectory
}: {
  repo: Repo,
  pathToDirectory: string,
  gitRef: string,
}) => pipe(
  OctokitTag,
  tryMapPromise({
    try: (octokit) => octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: repo.owner,
        repo: repo.name,
        path: pathToDirectory,
        ref: gitRef,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
      }
    ),
    catch: (error) => (error instanceof RequestError)
      ? error
      : new UnknownException(error, "Failed to request contents at the path inside GitHub repo")
  }),
  flatMap(({ data }) => Array.isArray(data)
    ? succeed(data)
    : fail(new Error(`${pathToDirectory} is not a directory`))
  )
);
