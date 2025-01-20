import type { YieldableError } from 'effect/Cause';
import type { Equals } from 'tsafe';
import { TaggedError } from 'effect/Data';
import { isFunction } from 'effect/Predicate';
import type { ParseError } from 'effect/ParseResult';

// This is a helper because typescript starts going crazy sometimes
export type GetSimpleFormError<T> = T extends object
  ? {
      [K in keyof T as Exclude<
        K,
        | Exclude<
            keyof YieldableError | keyof ParseError,
            'name' | 'message' | 'stack' | 'cause'
          >
        | symbol
      >]: GetSimpleFormError<T[K]>;
    }
  : T;

type VoidifyEmptyObject<O extends object> = Prettify<
  Equals<O, {}> extends true ? void : Readonly<GetSimpleFormError<O>>
>;

export const TaggedErrorVerifyingCause =
  <const DynamicContext extends Record<string, unknown> = {}>() =>
  <
    const ErrorName extends string,
    ExpectedCauseClass extends WideErrorConstructor | undefined,
    CauseArgTuple extends [ExpectedCauseClass] extends [WideErrorConstructor]
      ? [cause: InstanceType<ExpectedCauseClass>]
      : [],
    ConstructorArgs extends [
      ...CauseArgTuple,
      dynamicContext: VoidifyEmptyObject<DynamicContext>,
    ],
    MessageRendererArgs extends [
      ...CauseArgTuple,
      fullContext: VoidifyEmptyObject<DynamicContext & StaticContext>,
    ],
    const StaticContext extends Record<string, unknown> = {},
    ReturnType = new (...args: ConstructorArgs) => YieldableError &
      Readonly<
        {
          message: string;
          _tag: ErrorName;
          name: ErrorName;
        } & GetSimpleFormError<DynamicContext & StaticContext> &
          ([ExpectedCauseClass] extends [WideErrorConstructor]
            ? // To improve TS performance I wrap it in GetSimpleFormError
              {
                cause: GetSimpleFormError<InstanceType<ExpectedCauseClass>>;
              }
            : {})
      >,
  >(
    errorName: ErrorName,
    customMessage: string | ((...args: MessageRendererArgs) => string),
    expectedCauseClass?: ExpectedCauseClass,
    staticContext?: StaticContext,
  ): ReturnType => {
    const CustomTaggedErrorClass = TaggedError(errorName)<
      Record<'message' | '_tag' | 'name', unknown>
    >;

    class Base extends CustomTaggedErrorClass {
      constructor(...args: ConstructorArgs) {
        if (expectedCauseClass && !(args[0] instanceof expectedCauseClass))
          throw new Error(
            `Provided cause of incorrect type to "${
              errorName
            }" class. Expected cause class: "${expectedCauseClass.name}"`,
          );

        const customMessageRendererArgs = (
          expectedCauseClass
            ? [args[0], { ...args[1], ...staticContext }]
            : [{ ...args[0], ...staticContext }]
        ) as MessageRendererArgs;

        super({
          name: errorName,
          message: isFunction(customMessage)
            ? customMessage(...customMessageRendererArgs)
            : customMessage,
          ...(!!expectedCauseClass && { cause: args[0] }),
          ...staticContext,
          ...args[+!!expectedCauseClass], // dynamic context
        });
      }
    }

    return Base as ReturnType;
  };

export type Prettify<T> = T extends object
  ? { [K in keyof T]: Prettify<T[K]> }
  : T;

type WideErrorConstructor = new (...args: any[]) => Error;
