import type { Octokit as OctokitClient } from '@octokit/core';
import { Tag } from 'effect/Context';

export class OctokitTag extends Tag("OctokitService")<
  OctokitTag,
  OctokitClient
>() {}
