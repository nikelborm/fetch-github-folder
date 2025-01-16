import { Config } from 'effect';
import { tagged } from 'effect/Data';

export interface IRepo {
  owner: string;
  name: string;
}

export const RepoNameConfig = Config.nonEmptyString('NAME');
export const RepoOwnerConfig = Config.nonEmptyString('OWNER');

const RepoConfig = Config.all([RepoNameConfig, RepoOwnerConfig]);

export const SingleRunConfig = Config.all([
  Config.nested(RepoConfig, 'REPO'),
  Config.nonEmptyString('PATH_TO_DIRECTORY_IN_REPO').pipe(Config.option),
  Config.nonEmptyString(
    'LOCAL_PATH_AT_WHICH_ENTITY_FROM_REPO_WILL_BE_AVAILABLE',
  ),
  Config.nonEmptyString('GIT_REF').pipe(Config.option),
]);

tagged;
