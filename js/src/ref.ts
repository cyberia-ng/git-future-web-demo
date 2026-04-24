import { RefName } from "../pkg/rgit_web";
import { assertNever } from "./helpers/assert-never";
import { assertString } from "./helpers/assert-string";

export type RefNamePlainObject = { type: "head" } | { type: "ref"; name: string };

export function refNameToPlainObject(refName: RefName): RefNamePlainObject {
  const discriminator = refName.discriminator();
  switch (discriminator) {
    case "head":
      return { type: "head" };
    case "ref":
      return { type: "ref", name: assertString(refName.name()) };
  }
  assertNever(discriminator);
}

export function refNameFromPlainObject(refName: RefNamePlainObject): RefName {
  switch (refName.type) {
    case "head":
      return RefName.head();
    case "ref":
      return RefName.reference(refName.name);
  }
  assertNever(refName);
}
