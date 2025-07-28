import { NonRetriableError } from "inngest";
import { assertDefined } from "@/lib/utils/assert";

export const assertDefinedOrRaiseNonRetriableError = <T>(value: T | null | undefined): T => {
  try {
    return assertDefined(value);
  } catch (error) {
    throw new NonRetriableError("Value is undefined");
  }
};
