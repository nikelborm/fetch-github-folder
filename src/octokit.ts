import { Octokit as OctokitClient, OctokitOptions } from '@octokit/core';
import { Tag, type TagClass } from 'effect/Context';
import { provideService } from 'effect/Effect';
import { succeed } from 'effect/Layer';

// This bullshit is needed to please JSR
const _Tag: TagClass<OctokitTag, 'OctokitTag', OctokitClient> = Tag(
  'OctokitTag',
)<OctokitTag, OctokitClient>();

export class OctokitTag extends _Tag {}

export const OctokitLayer = (options?: OctokitOptions) =>
  succeed(OctokitTag, new OctokitClient(options));
