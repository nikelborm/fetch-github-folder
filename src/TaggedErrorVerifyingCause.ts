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

type CauseArgTupleGen<
  ExpectedCauseClass extends WideErrorConstructor | undefined,
> = [ExpectedCauseClass] extends [WideErrorConstructor]
  ? [cause: InstanceType<ExpectedCauseClass>]
  : [];

export type ConstructorArgsGen<
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  DynamicContext extends Record<string, unknown>,
> = [
  ...CauseArgTupleGen<ExpectedCauseClass>,
  dynamicContext: VoidifyEmptyObject<DynamicContext>,
];

export type MessageRendererArgsGen<
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  DynamicContext extends Record<string, unknown>,
  StaticContext extends Record<string, unknown>,
> = [
  ...CauseArgTupleGen<ExpectedCauseClass>,
  fullContext: VoidifyEmptyObject<DynamicContext & StaticContext>,
];

export type ReturnTypeUnknownCauseNoStatic<
  ErrorName extends string,
  DynamicContext extends Record<string, unknown> = {},
> = ReturnTypeGen<
  ErrorName,
  undefined,
  {},
  {
    cause: unknown;
  } & DynamicContext
>;

export type ReturnTypeNoCause<
  ErrorName extends string,
  StaticContext extends Record<string, unknown> = {},
  DynamicContext extends Record<string, unknown> = {},
> = ReturnTypeGen<ErrorName, undefined, StaticContext, DynamicContext>;

export type ReturnTypeNoCauseNoStatic<
  ErrorName extends string,
  DynamicContext extends Record<string, unknown> = {},
> = ReturnTypeGen<ErrorName, undefined, {}, DynamicContext>;

export type ReturnTypeNoStatic<
  ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  DynamicContext extends Record<string, unknown> = {},
> = ReturnTypeGen<ErrorName, ExpectedCauseClass, {}, DynamicContext>;

export type ReturnTypeGen<
  ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  StaticContext extends Record<string, unknown> = {},
  DynamicContext extends Record<string, unknown> = {},
> = new (
  ...args: ConstructorArgsGen<ExpectedCauseClass, DynamicContext>
) => YieldableError &
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
  >;

export type TaggedErrorVerifyingCauseTypes<
  ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  StaticContext extends Record<string, unknown> = {},
  DynamicContext extends Record<string, unknown> = {},
> = {
  MessageRendererArgs: MessageRendererArgsGen<
    ExpectedCauseClass,
    DynamicContext,
    StaticContext
  >;
  ReturnType: ReturnTypeGen<
    ErrorName,
    ExpectedCauseClass,
    StaticContext,
    DynamicContext
  >;
  ConstructorArgs: ConstructorArgsGen<ExpectedCauseClass, DynamicContext>;
};

export const TaggedErrorVerifyingCause =
  <const DynamicContext extends Record<string, unknown> = {}>() =>
  <
    const ErrorName extends string,
    ExpectedCauseClass extends WideErrorConstructor | undefined,
    Types extends TaggedErrorVerifyingCauseTypes<
      ErrorName,
      ExpectedCauseClass,
      StaticContext,
      DynamicContext
    >,
    const StaticContext extends Record<string, unknown> = {},
  >(
    errorName: ErrorName,
    customMessage: string | ((...args: Types['MessageRendererArgs']) => string),
    expectedCauseClass?: ExpectedCauseClass,
    staticContext?: StaticContext,
  ): Types['ReturnType'] => {
    const CustomTaggedErrorClass = TaggedError(errorName)<
      Record<'message' | '_tag' | 'name', unknown>
    >;

    class Base extends CustomTaggedErrorClass {
      constructor(...args: Types['ConstructorArgs']) {
        if (expectedCauseClass && !(args[0] instanceof expectedCauseClass))
          throw new Error(
            `Provided cause of incorrect type to "${
              errorName
            }" class. Expected cause class: "${expectedCauseClass.name}"`,
          );

        const customMessageRendererArgs = (expectedCauseClass
          ? [args[0], { ...args[1], ...staticContext }]
          : [
              { ...args[0], ...staticContext },
            ]) as unknown as Types['MessageRendererArgs'];

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

    return Base as Types['ReturnType'];
  };

export type Prettify<T> = T extends object
  ? { [K in keyof T]: Prettify<T[K]> }
  : T;

type WideErrorConstructor = new (...args: any[]) => Error;
