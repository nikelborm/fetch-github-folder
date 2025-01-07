import { YieldableError } from 'effect/Cause';
import type { Readonly } from "ts-toolbelt/out/Object/Readonly.d.ts";
import { TaggedError } from 'effect/Data';
import { isFunction } from 'effect/Predicate';
import { Equals } from 'effect/Types';

export const TaggedErrorVerifyingCause = <
  Context extends Record<string, any> = {}
>() => <
  const ErrorName extends string,
  ExpectedCauseClass extends (new(...args: any[]) => Error) | undefined,
  ConstructorArgs extends ([ExpectedCauseClass] extends [Exclude<ExpectedCauseClass, undefined>]
    ? [
      cause: InstanceType<ExpectedCauseClass>,
      ctx: ContextArg
    ]
    : [ctx: ContextArg]),
  ContextArg = Prettify<
    Equals<Context, {}> extends true
      ? void
      : Readonly<Context, string, 'deep'>
  >,
>(
  errorName: ErrorName,
  customMessage: string | ((...args: ConstructorArgs) => string),
  expectedCauseClass?: ExpectedCauseClass,
): {
  new (...args: ConstructorArgs): YieldableError & Readonly<{
    message: string;
    _tag: ErrorName;
    name: ErrorName;
    cause: InstanceType<Exclude<ExpectedCauseClass, undefined>>;
  } & Context>
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

type Prettify<T> = T extends object
  ? { [K in keyof T]: Prettify<T[K]> }
  : T;
