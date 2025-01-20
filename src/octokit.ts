import { Octokit as OctokitClient, OctokitOptions } from '@octokit/core';
import { Tag, type TagClass } from 'effect/Context';
import { provideService } from 'effect/Effect';

// This bullshit is needed to please JSR
const _Tag: TagClass<OctokitTag, 'OctokitTag', OctokitClient> = Tag(
  'OctokitTag',
)<OctokitTag, OctokitClient>();

export class OctokitTag extends _Tag {}

export function provideOctokit(options?: OctokitOptions) {
  return provideService(OctokitTag, new OctokitClient(options));
}
