import { Octokit } from '@octokit/core';
import { getPathContentsMetaInfo, logObjectNicely, OctokitTag } from './src/index.js';
import { andThen, flatMap, gen, provide, provideService, runPromise, succeed } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { TapLogBoth } from './src/TapLogBoth.js';
import { NodeTerminal } from '@effect/platform-node';
// import { requestRepoPathContentsFromGitHubAPI } from './src/getPathContentsMetaInfo/requestPathContentsMetaInfoFromGitHubAPI.js';
import { mapLeft } from 'effect/Either';
import { text } from 'node:stream/consumers';
import { Readable } from 'node:stream';


// await runPromise(
//   pipe(
//     getPathContentsMetaInfo({
//       path: "100mb_file.txt",
//       gitRef: "0362e8aec37c9146e1f946b27d98043a823357b7",
//       repo: {
//         owner: 'fetch-gh-folder-tests',
//         name: 'public-repo',
//       }
//     }),
//     TapLogBoth,
//     provideService(
//       OctokitTag,
//       new Octokit({
//         auth: '',
//       })
//     ),
//     provide(NodeTerminal.layer),
//   )
// )

// const octokit = new Octokit()

// const [
//   { data: blobReadme },
//   { data: blob100mbFile },
//   { data: readmeContents },
//   { data: _100mbFileContents }
// ] = await Promise.all([
//   octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
//     owner: 'fetch-gh-folder-tests',
//     repo: 'public-repo',
//     file_sha: 'e0581c6516af41608a222765cfb582f0bf89ed47', // readme
//     // mediaType: {
//     //   format: "raw",
//     // },
//     headers: {
//       'X-GitHub-Api-Version': '2022-11-28'
//     }
//   }),
//   octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
//     owner: 'fetch-gh-folder-tests',
//     repo: 'public-repo',
//     file_sha: '7557bc11dbc04337d33e6cd7e6b9bfa2d2d00e2b', // 100mb file
//     // mediaType: {
//     //   format: "raw",
//     // },
//     headers: {
//       'X-GitHub-Api-Version': '2022-11-28'
//     }
//   }),
//   octokit.request(
//     'GET /repos/{owner}/{repo}/contents/{path}',
//     {
//       owner: 'fetch-gh-folder-tests',
//       repo: 'public-repo',
//       path: 'README.md',
//       ref: 'aa01ad6b31edbfa41d18187215e7b9a35be34a1b',
//       mediaType: { format: 'object' },
//       headers: {
//         'X-GitHub-Api-Version': '2022-11-28'
//       },
//     }
//   ),
//   octokit.request(
//     'GET /repos/{owner}/{repo}/contents/{path}',
//     {
//       owner: 'fetch-gh-folder-tests',
//       repo: 'public-repo',
//       path: '100mb_file.txt',
//       ref: '0362e8aec37c9146e1f946b27d98043a823357b7',
//       mediaType: { format: 'object' },
//       headers: {
//         'X-GitHub-Api-Version': '2022-11-28'
//       },
//     }
//   ),
// ])

// logObjectNicely({
//   blobReadme,
//   blob100mbFile,
//   readmeContents,
//   _100mbFileContents,
// });


// await runPromise(
//   pipe(
//     requestRepoPathContentsFromGitHubAPI({
//       repo: {
//         owner: 'fetch-gh-folder-tests',
//         name: 'public-repo',
//       },
//       gitRef: "9898e22",
//       format: "raw",
//       streamBody: false,
//       path: "parentFolderDirectlyInRoot",
//     }),
//     // andThen(async e => await text(e.data as unknown as Readable)),
//     TapLogBoth,
//     provideService(
//       OctokitTag,
//       new Octokit()
//     ),
//     provide(NodeTerminal.layer),
//   )
// )
