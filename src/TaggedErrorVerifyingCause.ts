import { YieldableError } from 'effect/Cause';
import type { Readonly } from "ts-toolbelt/out/Object/Readonly.d.ts";
import { TaggedError } from 'effect/Data';
import { isFunction } from 'effect/Predicate';
import { Equals } from 'effect/Types';

// This is a helper because typescript starts going crazy sometimes
export type GetSimpleFormError<T> = T extends object ? {
  [K in keyof T as Exclude<K, Exclude<keyof YieldableError, 'name' | 'message' | 'stack' | 'cause'> | symbol | 'issue'>]: GetSimpleFormError<T[K]>;
} : T

export const TaggedErrorVerifyingCause = <
  Context extends Record<string, any> = {}
>() => <
  const ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  ConstructorArgs extends (
    [ExpectedCauseClass] extends [WideErrorConstructor]
      ? [
        cause: InstanceType<ExpectedCauseClass>,
        ctx: ContextArg
      ]
      // if it's [WideErrorConstructor | undefined] it's probably because it
      // wasn't specified at all, and when [undefined] specified it is also
      // clear
      : [ctx: ContextArg]
  ),
  ContextArg = Prettify<
    Equals<Context, {}> extends true
      ? void
      : Readonly<GetSimpleFormError<Context>, string, 'deep'>
  >,
>(
  errorName: ErrorName,
  customMessage: string | ((...args: ConstructorArgs) => string),
  expectedCauseClass?: ExpectedCauseClass,
): {
  new (...args: ConstructorArgs): Omit<YieldableError, 'cause'> & Readonly<{
    message: string;
    _tag: ErrorName;
    name: ErrorName;
  } & (
    [ExpectedCauseClass] extends [WideErrorConstructor]
    // To improve TS performance I wrap it in GetSimpleFormError
    ? { cause: GetSimpleFormError<InstanceType<ExpectedCauseClass>>; }
    : {}
  ) & Context>
} => {
  const CustomTaggedErrorClass = TaggedError(errorName)<any>;

  class Base extends CustomTaggedErrorClass {
    constructor(...args: ConstructorArgs) {
      if(!(args[0] instanceof expectedCauseClass!))
        throw new Error(`Provided cause of incorrect type to ${
          errorName
        } class. Expected cause class: "${expectedCauseClass!.name}"`);

      super({
        name: errorName,
        message: isFunction(customMessage)
          ? (customMessage as any)(args[0], args[1])
          : customMessage,
        ...(!!expectedCauseClass && { cause: args[0] }),
        ...(args[~~!!expectedCauseClass])
      });
    }
  }

  return Base as any;
}

export type Prettify<T> = T extends object
  ? { [K in keyof T]: Prettify<T[K]> }
  : T;

type WideErrorConstructor = new (...args: any[]) => Error;
