import {
  text,
  withFallbackConfig,
  withDescription as withOptionDescription,
  withSchema,
} from '@effect/cli/Options';
import { Path } from '@effect/platform/Path';
import {
  nonEmptyString as nonEmptyStringConfig,
  validate as validateConfig,
  withDefault as withConfigDefault,
  withDescription as withConfigDescription,
} from 'effect/Config';
import { flatMap } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { Type, fail, succeed } from 'effect/ParseResult';
import { NonEmptyString, filter, transformOrFail } from 'effect/Schema';
import { outdent } from 'outdent';

const validateGitHubSlug = (s: string) => !!s.match(/^[a-z0-9.\-_]+$/gi);
const invalidGitHubSlugMessage = `GitHub handle should have only ASCII letters, digits, and the characters ".", "-", and "_"`;

// https://developer.mozilla.org/en-US/docs/Glossary/Slug
const GitHubSlugStringSchema = NonEmptyString.pipe(
  filter(s => validateGitHubSlug(s) || invalidGitHubSlugMessage),
);

const withGitHubSlugConfigValidation = validateConfig({
  message: invalidGitHubSlugMessage,
  validation: validateGitHubSlug,
});

const pathToEntityInRepoDescription = 'Path to file or directory in repo';
const repoOwnerDescription = outdent`
  This is a username (login handle) of a person owning repo you
  are trying to download from. For example, if the repository's URL is
  \`https://github.com/apache/superset\`, the owner is \`apache\`
`;
const repoNameDescription = outdent`
  This is the name handle of the repository you are trying to download
  from. For example, if the repository's URL is
  \`https://github.com/apache/superset\`, the name is \`superset\`
`;
const destinationPathDescription = outdent`
  Local path of the downloaded file or directory. If
  "pathToEntityInRepo" points to a file, then last element of the
  destination path will be new file name. If "pathToEntityInRepo" points
  to a directory then all files and directories inside directory at
  "pathToEntityInRepo" will be put into a directory with name equal last
  element of destination path. If the directory doesn't exist, it will
  be automatically created.
`;
const gitRefDescription = outdent`
  This is the commit's SHA hash, branch name, tag name, or any other ref
  you want to download from. If you don't specify it, the default branch
  in the repository will be used.
`;

const RepoNameConfig = pipe(
  nonEmptyStringConfig('GITHUB_REPO_NAME'),
  withGitHubSlugConfigValidation,
  withConfigDescription(repoNameDescription),
);

const RepoOwnerConfig = pipe(
  nonEmptyStringConfig('GITHUB_REPO_OWNER'),
  withGitHubSlugConfigValidation,
  withConfigDescription(repoOwnerDescription),
);

const DestinationPathConfig = pipe(
  nonEmptyStringConfig('DESTINATION_PATH'),
  withConfigDefault('./destination'),
  withConfigDescription(destinationPathDescription),
);

const PathToEntityInRepoConfig = pipe(
  nonEmptyStringConfig('PATH_TO_ENTITY_IN_REPO'),
  withConfigDefault('.'),
  withConfigDescription(pathToEntityInRepoDescription),
);

const GitRefConfig = pipe(
  nonEmptyStringConfig('GIT_REF'),
  withConfigDefault('HEAD'),
  withConfigDescription(gitRefDescription),
);

const CleanRepoEntityPathString = transformOrFail(
  NonEmptyString,
  NonEmptyString,
  {
    strict: true,
    decode: (dirtyPathToEntityInRepo, _, ast) =>
      flatMap(Path, path => {
        // dot can be there only when that's all there is. path.join(...)
        // removes all './', so '.' will never be just left by themself. If it's
        // there, it's very intentional and no other elements in the path exist.
        const cleanPathToEntityInRepo = path
          .join(dirtyPathToEntityInRepo)
          .replaceAll(/\/?$/g, '');

        if (cleanPathToEntityInRepo.startsWith('..'))
          return fail(
            new Type(
              ast,
              dirtyPathToEntityInRepo,
              "Can't request contents that lie higher than the root of the repo",
            ),
          );
        return succeed(cleanPathToEntityInRepo);
      }),
    encode: succeed,
  },
);

export const pathToEntityInRepoCLIOptionBackedByEnv = pipe(
  text('pathToEntityInRepo'),
  withOptionDescription(pathToEntityInRepoDescription),
  withFallbackConfig(PathToEntityInRepoConfig),
  withSchema(CleanRepoEntityPathString),
);

export const repoOwnerCLIOptionBackedByEnv = pipe(
  text('repoOwner'),
  withOptionDescription(repoOwnerDescription),
  withFallbackConfig(RepoOwnerConfig),
  withSchema(GitHubSlugStringSchema),
);

export const repoNameCLIOptionBackedByEnv = pipe(
  text('repoName'),
  withOptionDescription(repoNameDescription),
  withFallbackConfig(RepoNameConfig),
  withSchema(GitHubSlugStringSchema),
);

export const destinationPathCLIOptionBackedByEnv = pipe(
  text('destinationPath'),
  withOptionDescription(destinationPathDescription),
  withFallbackConfig(DestinationPathConfig),
);

export const gitRefCLIOptionBackedByEnv = pipe(
  text('gitRef'),
  withOptionDescription(gitRefDescription),
  withFallbackConfig(GitRefConfig),
);
