import { RequestError } from "@octokit/request-error";
import { Effect as E, pipe } from 'effect';
import { UnknownException } from 'effect/Cause';
import { tryMapPromise } from 'effect/Effect';
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
  E.flatMap(({ data }) => Array.isArray(data)
    ? E.succeed(data)
    : E.fail(new Error(`${pathToDirectory} is not a directory`))
  )
);
