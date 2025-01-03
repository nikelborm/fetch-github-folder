import type { Octokit as OctokitClient } from '@octokit/core';
import { Tag, type TagClass } from 'effect/Context';

// This bullshit is needed to please JSR
const _Tag: TagClass<OctokitTag, "OctokitTag", OctokitClient>
  = Tag("OctokitTag")<OctokitTag, OctokitClient>();

export class OctokitTag extends _Tag {}
