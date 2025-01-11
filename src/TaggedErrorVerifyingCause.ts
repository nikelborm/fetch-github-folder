import { YieldableError } from 'effect/Cause';
import { Equals } from 'tsafe';
import type { Readonly } from "ts-toolbelt/out/Object/Readonly.d.ts";
import { TaggedError } from 'effect/Data';
import { isFunction } from 'effect/Predicate';

// This is a helper because typescript starts going crazy sometimes
export type GetSimpleFormError<T> = T extends object ? {
  [K in keyof T as Exclude<
    K,
    | Exclude<
      keyof YieldableError,
      'name' | 'message' | 'stack' | 'cause'
    >
    | symbol
    | 'issue'
  >]: GetSimpleFormError<T[K]>;
} : T

export const TaggedErrorVerifyingCause = <
  const DynamicContext extends Record<string, unknown> = {},
>() => <
  const ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  ConstructorArgs extends (
    [ExpectedCauseClass] extends [WideErrorConstructor]
      ? [
        cause: InstanceType<ExpectedCauseClass>,
        dynamicContext: ConstructorDynamicContextArg
      ]
      // if it's [WideErrorConstructor | undefined] it's probably because it
      // wasn't specified at all, and when [undefined] specified it is also
      // clear
      : [dynamicContext: ConstructorDynamicContextArg]
  ),
  MessageRendererArgs extends (
    [ExpectedCauseClass] extends [WideErrorConstructor]
      ? [
        cause: InstanceType<ExpectedCauseClass>,
        fullContext: MessageRendererFullContextArg
      ]
      // if it's [WideErrorConstructor | undefined] it's probably because it
      // wasn't specified at all, and when [undefined] specified it is also
      // clear
      : [fullContext: MessageRendererFullContextArg]
  ),
  const StaticContext extends Record<string, unknown> = {},
  MessageRendererFullContextArg = Prettify<
    Equals<DynamicContext & StaticContext, {}> extends true
      ? void
      : Readonly<GetSimpleFormError<DynamicContext & StaticContext>, string, 'deep'>
  >,
  ConstructorDynamicContextArg = Prettify<
    Equals<DynamicContext, {}> extends true
      ? void
      : Readonly<GetSimpleFormError<DynamicContext>, string, 'deep'>
  >,
>(
  errorName: ErrorName,
  customMessage: string | ((...args: MessageRendererArgs) => string),
  expectedCauseClass?: ExpectedCauseClass,
  staticContext?: StaticContext,
): {
  new (...args: ConstructorArgs): YieldableError & Readonly<{
    message: string;
    _tag: ErrorName;
    name: ErrorName;
  } & (
    [ExpectedCauseClass] extends [WideErrorConstructor]
    // To improve TS performance I wrap it in GetSimpleFormError
    ? { cause: GetSimpleFormError<InstanceType<ExpectedCauseClass>>; }
    : {}
  ) & DynamicContext & StaticContext>
} => {
  const CustomTaggedErrorClass = TaggedError(errorName)<
    Record<'message' | '_tag' | 'name', unknown>
  >;

  class Base extends CustomTaggedErrorClass {
    constructor(...args: ConstructorArgs) {
      if(expectedCauseClass && !(args[0] instanceof expectedCauseClass))
        throw new Error(`Provided cause of incorrect type to ${
          errorName
        } class. Expected cause class: "${expectedCauseClass.name}"`);

        const customMessageRendererArgs = (expectedCauseClass
          ? [ args[0], { ...args[1], ...staticContext }]
          : [{ ...args[0], ...staticContext }]
        ) as MessageRendererArgs

      super({
        name: errorName,
        message: isFunction(customMessage)
          ? customMessage.apply(
            void 0,
            customMessageRendererArgs
          )
          : customMessage,
        ...(!!expectedCauseClass && { cause: args[0] }),
        ...staticContext,
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
