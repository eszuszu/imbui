import { getKeyframeEffect, getDefaultEffectOptions } from "./keyframe-definitions";
import { AnimationController } from "./animation-controller";
import type { LoggerService } from "../services/logger-service";

export type AnimationInput = string | { keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions };

export interface DomAnimatorFactory {
  createAnimation(element: HTMLElement, animationInput: AnimationInput): AnimationController;
}

interface CreateDomAnimatorOptions {
  logger?: LoggerService;
}

/**
 * Factory function to create a DomAnimator instance.
 * The instance is responsible for the low-level creation of AnimationController objects from animation/keyframe effect definitions.
 * 
 */
export function createDomAnimator(options: CreateDomAnimatorOptions = {}): DomAnimatorFactory {
  const { logger = console } = options;

  const getAnimationConfig = (animationInput: AnimationInput): { keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions } | null => {

    let keyframes: Keyframe[] | PropertyIndexedKeyframes = [];
    let options: KeyframeAnimationOptions | undefined;

    if (typeof animationInput === 'string') {
      const definition = getKeyframeEffect(animationInput);
      if (!definition) {
        logger.warn(`[createDomAnimator] Animation Effect definition '${animationInput}' not found.`);
        return null;
      }
      keyframes = definition.keyframes;
      options = definition.options;
    } else {
      keyframes = animationInput.keyframes;
      options = animationInput.options;
    }
    return { keyframes, options: options || getDefaultEffectOptions() };
  };

  return {
    createAnimation(element: HTMLElement, animationInput: AnimationInput): AnimationController {
      const config = getAnimationConfig(animationInput);
      if (!config) {
        logger.error(`[createDomAnimator] Failed to create animation for element. Invalid animation input.`);
        //returns a dummy controller with a no-op animation
        return new AnimationController(new Animation(new KeyframeEffect(element, [], {}), document.timeline));;
      }
      try {
        const effect = new KeyframeEffect(element, config.keyframes, config.options);
        const nativeAnimation = new Animation(effect, document.timeline);
        return new AnimationController(nativeAnimation);
      } catch (e) {
        logger.error(`[createDomAnimator] Failed to create native Web Animation:`, e);
        return new AnimationController(new Animation(new KeyframeEffect(element, [], {}), document.timeline));
      }

    }
  }
}