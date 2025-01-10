import { gen, succeed } from 'effect/Effect';
import { ParseToReadableStream } from '../parseToReadableStream.js';
import { Repo } from '../repo.interface.js';
import { TapLogBoth } from '../TapLogBoth.js';
import { parseGitLFSObject } from './parseGitLFSObject.js';
import { requestPathContentsMetaInfoFromGitHubAPI } from './requestPathContentsMetaInfoFromGitHubAPI.js';

// : Effect<
//   (typeof ResponseSchema)['Type'],
//   | GitHubApiCommonErrors
//   | GitHubApiRepoIsEmpty
//   | GitHubApiRepoDoesNotExistsOrPermissionsInsufficient
//   | UnknownException
//   | ParseError,
//   OctokitTag
// >

export const getPathContentsMetaInfo = ({
  repo,
  gitRef,
  path: requestedPath
}: {
  repo: Repo,
  path: string,
  gitRef?: string | undefined,
}) => gen(function* () {
  const response = yield* requestPathContentsMetaInfoFromGitHubAPI({
    repo,
    gitRef,
    path: requestedPath
  });

  const { type, name, path, sha, size } = response;

  if (requestedPath !== path) throw new Error(`Requested path (${requestedPath}) doesn't match returned path (${path})`)

  if (type === "dir") {
    const { entries } = response;
    if (!name || !path) return {
      type,
      treeSha: sha,
      entries,
      meta: "This root directory of the repo can be downloaded as a git tree"
    } as const
    return {
      type,
      name,
      path,
      treeSha: sha,
      entries,
      meta: "This nested directory can be downloaded as a git tree"
    } as const;
  }

  const { content, encoding, sha: _, ...base } = response;

  // This is quite a graceful implementation. I had the choice to throw
  // errors whenever GitHub's API didn't follow its documentation. I even
  // did that initially, but when I looked at the resulting mess, I changed
  // my mind not to. For example I could throw errors in following cases:
  //
  // 1. when size is between 1 mb and 100 mb per documentation I should
  //    never receive data, instead receiving empty "content" field and
  //    "encoding" field equal "none". I could have thrown error if this
  //    promise is broken, instead if received 50mb file and correct
  //    encoding I will parse and return it.
  // 2. per documentation all files higher than 100mb should be put into
  //    Git LFS storage. If I receive 110mb file inlined, I'll will not
  //    fail and will parse and return it.
  // 3. per documentation when size less than 1MB it MUST be inlined. If it
  //    wasn't inlined I could have thrown error, but instead I just return
  //    saying "it's a blob, download it elsewhere"
  // 4. per documentation files with size larger than 100 mb must be in a
  //    git LFS storage and it's assumed that git LFS annotation will be
  //    provided. But if it's not provided, instead of throwing error, I
  //    say "it's a blob, download it elsewhere"

  // In the end it leads to much lower complexity with a ton of IFs removed
  if (encoding !== 'none') {
    const contentAsBuffer = Buffer.from(content, encoding);

    const potentialGitLFSObject = yield* parseGitLFSObject({
      contentAsBuffer,
      blobSha: sha,
      expectedContentSize: size,
      name,
      path,
    });

    if (potentialGitLFSObject !== "This is not a git LFS object")
      return potentialGitLFSObject;

    const stream = yield* ParseToReadableStream(succeed(contentAsBuffer));

    return {
      ...base,
      blobSha: sha,
      content: stream,
      meta: "This file is small enough that GitHub API decided to inline it"
    } as const;
  } else {
    return {
      ...base,
      blobSha: sha,
      meta: "This file can be downloaded as a blob"
    } as const;
  }
}).pipe(TapLogBoth);
