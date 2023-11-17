// @ts-check
'use strict';

/**
 * @param {string} name
 */
export function getEnvVarOrFail(name) {
  const envVar = process.env[name];

  if (!envVar)
    throw new Error(`env var ${name} is not defined`);

  return envVar;
}
