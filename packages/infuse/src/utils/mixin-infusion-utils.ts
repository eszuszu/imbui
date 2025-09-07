/* eslint-disable @typescript-eslint/no-explicit-any */
import { Constructor, MixinFunction } from "../mixins";

/**
 * @template TAppliedMixinCtor represents the constructor type returned byt the mixin function
 */
type ApplyOneMixin<TBaseC extends Constructor<any>, TMixinFn extends MixinFunction<any, any>> = TMixinFn extends (base: infer _B) => infer TAppliedMixinCtor //infer the *constructor* type that mixin returns
  ? TAppliedMixinCtor extends Constructor<any>
    ? Constructor<InstanceType<TBaseC> & InstanceType<TAppliedMixinCtor>>
    : never
  : never;

/**
 * Recursively applies an array of mixins to a base class from left to right.
 * this type accurately infers the final combined class constructor type.
 * 
 * @template TBase Initial base class of constructor type.
 * @template TMixins Readonly tuple of mixin functions.
 */
type InfuseChain<
  TBase extends Constructor<any>,
  TMixins extends readonly MixinFunction<any, any>[]
> = TMixins extends readonly []
  ? TBase
  : TMixins extends readonly [infer THead extends MixinFunction<any, any>, ...infer TTail extends readonly MixinFunction<any, any>[]] //recurse case
  ? InfuseChain<ApplyOneMixin<TBase, THead>, TTail> //apply the head mixin, then recursively apply the tail to the result.
  : never;

/** A utility function to apply a series of mixins to a base class.
 * The mixins are applied in the order they are provided in the array (left-to-right).
 * 
 * @example
 * // If the mixins are defined like:
 * // const M1 = <T extends Constructor>(Base: T) => class extends Base { m1Prop = 1; };
 * // const M2 = <T extends Constructor>(Base: T) => class extends Base { m2Prop = 'a'; };
 * 
 * // class MyComponent extends infuse(HTMLElement, M1, M2) {
 * // MyComponent now has props from HTMLElement, M1, M2...
 * // 
 * // }
 * 
 * @param BaseClass The initial base class~
 * @param mixins An array of mixin functions to apply
 * @returns A new class constructor with all mixins applied. preserving type info.
 */
export function infuse<
B extends Constructor<any>,
M extends readonly MixinFunction<any, any>[]
>(
  BaseClass: B,
  ...mixins: M
): InfuseChain<B, M> {
  return mixins.reduce(
    (currentClass: Constructor<any>, mixin: MixinFunction<any, any>) => mixin(currentClass), BaseClass) as InfuseChain<B, M>
}