import { TaggedError } from 'effect/Data';

export const TaggedErrorVerifyingCause = <
  const ErrorName extends string,
  ExpectedCauseClass extends new(...args: any[]) => Error
>(
  errorName: ErrorName,
  expectedCauseClass: ExpectedCauseClass,
  customMessage: string
): {
  new (cause: InstanceType<ExpectedCauseClass>): (
    InstanceType<typeof CustomTaggedErrorClass>
    & { name: ErrorName }
  )
} => {
  const CustomTaggedErrorClass = TaggedError(errorName)<{
    message: string,
    name: ErrorName,
    cause: InstanceType<ExpectedCauseClass>
  }>;

  class Base extends CustomTaggedErrorClass {
    constructor(cause: InstanceType<ExpectedCauseClass>) {
      if (!(cause instanceof expectedCauseClass))
        throw new Error(`Provided cause of incorrect type to ${
          errorName
        } class. Expected cause class: "${expectedCauseClass.name}"`);

      super({ message: customMessage, cause, name: errorName });
    }
  }

  return Base;
}
