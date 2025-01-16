import { gen, succeed } from 'effect/Effect';
import { ParseToReadableStream } from '../parseToReadableStream.js';
import { TapLogBoth } from '../TapLogBoth.js';
import { parseGitLFSObject } from './parseGitLFSObject.js';
import { requestMetaInfoAboutPathContentsFromGitHubAPI } from './requestMetaInfoAboutPathContentsFromGitHubAPI.js';

// : Effect<
//   (typeof ResponseSchema)['Type'],
//   | GitHubApiCommonErrors
//   | GitHubApiRepoIsEmpty
//   | GitHubApiRepoDoesNotExistsOrPermissionsInsufficient
//   | UnknownException
//   | ParseError,
//   OctokitTag
// >

export const getPathContentsMetaInfo = gen(function* () {
  const response = yield* requestMetaInfoAboutPathContentsFromGitHubAPI;

  const { type, name, path, sha, size } = response;

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

  // This is quite forgiving implementation. I had the choice to throw
  // errors whenever GitHub's API didn't follow its documentation. I even
  // did that initially, but when I looked at the resulting mess, I changed
  // my mind not to. For example, I could throw errors in the following
  // cases:

  // 1. When the size is between 1 MB and 100 MB per documentation, I
  //    should never receive data. Instead, I should receive an empty
  //    "content" field and an "encoding" field equal to "none." If this
  //    promise was broken, I could have thrown an error. Instead, if I
  //    receive a 50 MB file with the correct encoding, I will parse and
  //    return it.
  // 2. Per the documentation, all files larger than 100 MB should be put
  //    into Git LFS storage. If I receive a 110 MB file inlined, I'll not
  //    fail; I'll parse and return it.
  // 3. Per documentation when size less than 1MB it MUST be inlined. If it
  //    wasn't inlined I could have thrown an error, but instead, I just
  //    returned an object representing the message "It's a blob, download
  //    it elsewhere"
  // 4. Per documentation files larger than 100 mb must be in a git LFS
  //    storage and it's assumed that git LFS annotation will be provided.
  //    But if it's not provided, instead of throwing an error, I returned
  //    an object representing the message "It's a blob, download it
  //    elsewhere"

  // In the end it leads to much lower complexity with a ton of IFs removed
  if (encoding !== 'none') {
    const contentAsBuffer = Buffer.from(content, encoding);

    const potentialGitLFSObject = yield* parseGitLFSObject({
      contentAsBuffer,
      blobSha: sha,
      expectedContentSize: size,
      fileName: name,
      pathToFileInRepo: path,
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
