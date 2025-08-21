export interface KeyframeDefinition {
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  options?: KeyframeAnimationOptions;
}

/**
 * currently this registes a KeyframeEffect
 * to a singleton registry, these are blueprints for creating animation object instances
 *
 */
const definitionsMap = new Map<string, KeyframeDefinition>();

export function registerKeyframeEffect(name: string, keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions): void {

  if (definitionsMap.has(name)) {
    console.warn(`[AnimationDefinitions] Animation '${name}' is already registered. Overwriting.`);
  }
  definitionsMap.set(name, { keyframes, options });
}

export function getKeyframeEffect(name: string): KeyframeDefinition | undefined {
  return definitionsMap.get(name);
}

export function getDefaultEffectOptions(): KeyframeAnimationOptions {
  return { duration: 300, easing: 'ease-out', fill: 'forwards' };
}

export function hasKeyframeEffect(name: string): boolean {
  return definitionsMap.has(name);
}

registerKeyframeEffect('fadeIn', [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
registerKeyframeEffect('fadeOut', [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
registerKeyframeEffect('slideInRight', [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: 400, easing: 'ease-out', fill: 'forwards' });
registerKeyframeEffect('slideOutLeft', [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }], { duration: 400, easing: 'ease-in', fill: 'forwards' })