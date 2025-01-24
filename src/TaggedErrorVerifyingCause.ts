import type { YieldableError } from 'effect/Cause';
import type { Equals } from 'tsafe';
import { TaggedError } from 'effect/Data';
import { isFunction } from 'effect/Predicate';

type VoidifyEmptyObject<O extends object> = Prettify<
  Equals<O, {}> extends true ? void : Readonly<O>
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

// Classes

export type TaggedErrorClass<
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
    } & DynamicContext &
      StaticContext &
      ([ExpectedCauseClass] extends [WideErrorConstructor]
        ? // To improve TS performance I wrap it in GetSimpleFormError
          {
            cause: InstanceType<ExpectedCauseClass>;
          }
        : {})
  >;

export type TaggedErrorClassWithUnknownCauseAndNoStaticContext<
  ErrorName extends string,
  DynamicContext extends Record<string, unknown>,
> = TaggedErrorClass<
  ErrorName,
  undefined,
  {},
  {
    cause: unknown;
  } & DynamicContext
>;

export type TaggedErrorClassWithUnknownCauseAndNoContext<
  ErrorName extends string,
> = TaggedErrorClass<ErrorName, undefined, {}, { cause: unknown }>;

export type TaggedErrorClassWithNoCause<
  ErrorName extends string,
  StaticContext extends Record<string, unknown>,
  DynamicContext extends Record<string, unknown>,
> = TaggedErrorClass<ErrorName, undefined, StaticContext, DynamicContext>;

export type TaggedErrorClassWithNoStaticContextAndNoCause<
  ErrorName extends string,
  DynamicContext extends Record<string, unknown>,
> = TaggedErrorClass<ErrorName, undefined, {}, DynamicContext>;

export type TaggedErrorClassWithNoContextAndNoCause<ErrorName extends string> =
  TaggedErrorClass<ErrorName, undefined>;

export type TaggedErrorClassWithNoContext<
  ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
> = TaggedErrorClass<ErrorName, ExpectedCauseClass>;

export type TaggedErrorClassWithNoStaticContext<
  ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  DynamicContext extends Record<string, unknown>,
> = TaggedErrorClass<ErrorName, ExpectedCauseClass, {}, DynamicContext>;

// Instances

export type TaggedErrorInstance<
  ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  StaticContext extends Record<string, unknown> = {},
  DynamicContext extends Record<string, unknown> = {},
> = InstanceType<
  TaggedErrorClass<ErrorName, ExpectedCauseClass, StaticContext, DynamicContext>
>;

export type TaggedErrorInstanceWithUnknownCauseAndNoStaticContext<
  ErrorName extends string,
  DynamicContext extends Record<string, unknown>,
> = InstanceType<
  TaggedErrorClassWithUnknownCauseAndNoStaticContext<ErrorName, DynamicContext>
>;

export type TaggedErrorInstanceWithUnknownCauseAndNoContext<
  ErrorName extends string,
> = InstanceType<TaggedErrorClassWithUnknownCauseAndNoContext<ErrorName>>;

export type TaggedErrorInstanceWithNoCause<
  ErrorName extends string,
  StaticContext extends Record<string, unknown>,
  DynamicContext extends Record<string, unknown>,
> = InstanceType<
  TaggedErrorClassWithNoCause<ErrorName, StaticContext, DynamicContext>
>;

export type TaggedErrorInstanceWithNoStaticContextAndNoCause<
  ErrorName extends string,
  DynamicContext extends Record<string, unknown>,
> = InstanceType<
  TaggedErrorClassWithNoStaticContextAndNoCause<ErrorName, DynamicContext>
>;

export type TaggedErrorInstanceWithNoContextAndNoCause<
  ErrorName extends string,
> = InstanceType<TaggedErrorClassWithNoContextAndNoCause<ErrorName>>;

export type TaggedErrorInstanceWithNoContext<
  ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
> = InstanceType<TaggedErrorClassWithNoContext<ErrorName, ExpectedCauseClass>>;

export type TaggedErrorInstanceWithNoStaticContext<
  ErrorName extends string,
  ExpectedCauseClass extends WideErrorConstructor | undefined,
  DynamicContext extends Record<string, unknown>,
> = InstanceType<
  TaggedErrorClassWithNoStaticContext<
    ErrorName,
    ExpectedCauseClass,
    DynamicContext
  >
>;

// Other

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
  TaggedErrorClass: TaggedErrorClass<
    ErrorName,
    ExpectedCauseClass,
    StaticContext,
    DynamicContext
  >;
  ConstructorArgs: ConstructorArgsGen<ExpectedCauseClass, DynamicContext>;
};

export const buildTaggedErrorClassVerifyingCause =
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
  ): Types['TaggedErrorClass'] => {
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

    return Base as Types['TaggedErrorClass'];
  };

export type Prettify<T> = T extends object
  ? { [K in keyof T]: Prettify<T[K]> }
  : T;

type WideErrorConstructor = new (...args: any[]) => Error;
