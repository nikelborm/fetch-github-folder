import { Octokit as OctokitClient } from '@octokit/core';
import { Context } from 'effect';

export class OctokitTag extends Context.Tag("OctokitService")<
  OctokitTag,
  OctokitClient
>() {}
