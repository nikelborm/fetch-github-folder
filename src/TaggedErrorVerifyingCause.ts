import { YieldableError } from 'effect/Cause';
import { TaggedError } from 'effect/Data';
import { Equals } from 'effect/Types';

export const TaggedErrorVerifyingCause = <
  Context extends Record<string, any> = {}
>() => <
  const ErrorName extends string = string,
  ExpectedCauseClass extends new(...args: any[]) => Error = new(...args: any[]) => Error,
  ContextArg = Equals<Context, {}> extends true ? void : Context,
>(
  errorName: ErrorName,
  expectedCauseClass: ExpectedCauseClass,
  customMessage: string
): {
  new (
    cause: InstanceType<ExpectedCauseClass>,
    ctx: ContextArg
  ): YieldableError & Readonly<{
    message: string;
    _tag: ErrorName;
    name: ErrorName;
    cause: InstanceType<ExpectedCauseClass>;
  } & Context>
} => {
  const CustomTaggedErrorClass = TaggedError(errorName)<{
    message: string
  }>;

  class Base extends CustomTaggedErrorClass {
    constructor(cause: unknown, ctx: ContextArg) {
      if (!(cause instanceof expectedCauseClass))
        throw new Error(`Provided cause of incorrect type to ${
          errorName
        } class. Expected cause class: "${expectedCauseClass.name}"`);

      super({ message: customMessage, cause, name: errorName, ...ctx });
    }
  }

  return Base as any;
}
