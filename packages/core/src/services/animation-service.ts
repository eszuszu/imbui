import { signal, effect } from "@imbui/pulse"
import type { Signal } from '@imbui/pulse';

import { LoggerService } from './logger-service';

import { createDomAnimator, type DomAnimatorFactory } from '../animation/create-dom-animator';
import { AnimationController } from "../animation/animation-controller";
import { registerKeyframeEffect } from "../animation/keyframe-definitions";

type AnimationInput = string | { keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions };


/**
 * The central Animation Service responsible for global animation orchestration,
 * management, and providing animation instances to componnents.
 */
export class AnimationService {
  private _domAnimatorFactory: DomAnimatorFactory;
  private _managedAnimations = new Map<string, AnimationController>();
  private _globalPauseState: Signal<boolean>;
  private _globalPlaybackRate: Signal<number>;
  private _logger: LoggerService;
  private _reducedMotion: Signal<boolean>;

  private _mediaQueryList: MediaQueryList | null = null;


  private _cleanupGlobalPauseEffect: (() => void) | null = null;
  private _cleanupGlobalPlaybackRateEffect: (() => void) | null = null;

  constructor(logger: LoggerService) {
    this._logger = logger;
    this._domAnimatorFactory = createDomAnimator({ logger: logger });

    this._globalPauseState = signal(false);
    this._globalPlaybackRate = signal(1.0);
    this._reducedMotion = signal(false);

    this._mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = (event: MediaQueryListEvent | MediaQueryList) => {
      this._reducedMotion.set(event.matches);
      this._logger.log(`[AnimationService] prefers-reduced-motion changed to: ${event.matches ? 'reduce' : 'no-preference'}`);
    };

    updateReducedMotion(this._mediaQueryList);

    this._mediaQueryList.addEventListener('change', updateReducedMotion);

    this._cleanupGlobalPauseEffect = effect(() => {
      const isPaused = this._globalPauseState.get();
      this._logger.log(`[AnimationService] Global pause state changed to: ${isPaused}. Applying to all managed animations.`);
      this._managedAnimations.forEach(controller => {
        if (isPaused) {
          controller.pause('global');
        } else {
          controller.resume('global');
        }
      })
    });

    this._cleanupGlobalPlaybackRateEffect = effect(() => {
      let playbackRate = this._globalPlaybackRate.get();
      const reducedMotionActive = this._reducedMotion.get();

      if (reducedMotionActive) {
        playbackRate = 0;
        //might want component-level overrides here.
      }

      this._logger.log(`[AnimationService] Applying effective playback rate: ${playbackRate}. (Reduced motion: ${reducedMotionActive})`);
      this._managedAnimations.forEach(controller => {
        if (controller.nativeAnimation) {
          controller.nativeAnimation.playbackRate = playbackRate;
        }
      });
    });

    this._logger.log('[AnimationService] Initialized.');
  }
  /**
  * Allows registering definitions directly via the service.
  * Or components can import animation-definitions.ts directly.
  */
  registerKeyframeDefinition(name: string, keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions): void {
    registerKeyframeEffect(name, keyframes, options);

  }

  /**
   * Creates and registers an AnimationController instance, which the service will then manage.
   * Components should use this method to get their animation instances.
   * @param id A unique ID for this specific animtion instance (e.g., 'nav-menu-toggle')
   * @param element the HTMLElement to animate.
   * @param animationInput The name of a registered animation definition or a direct config.
   * @returns the managed AnimationController instance.
   */
  createManagedAnimation(id: string, element: HTMLElement, animationInput: AnimationInput): AnimationController {
    if (this._managedAnimations.has(id)) {
      console.warn(`[AnimationService] Animation with ID '${id}' already exists. Overwriting.`);
      //consider stopping or throwing error
      this._managedAnimations.get(id)?.stop();
    }

    const controller = this._domAnimatorFactory.createAnimation(element, animationInput);
    this._managedAnimations.set(id, controller);

    return controller;
  }

  createAnimations(animationInputs: { id: string, element: HTMLElement, animationInput: AnimationInput }[]): { id: string, controller: AnimationController }[] {
    const controllers = [];

    for (const input of animationInputs) {
      const { id, element, animationInput } = input;

      if (this._managedAnimations.has(id)) {
        console.warn(`[AnimationService] Animation with ID '${id}' already exists. Overwriting.`);
        //consider stopping or throwing error
        this._managedAnimations.get(id)?.stop();
      }

      const controller = this._domAnimatorFactory.createAnimation(element, animationInput);
      this._managedAnimations.set(id, controller);
      controllers.push({ id, controller });
    }
    return controllers;
  }

  get reducedMotion(): Signal<boolean> {
    return this._reducedMotion;
  }

  /**
   * Retrieves a prev managed AnimationContrller by its ID.
   * Useful to control an animation created elsewhere by ID.
   */
  getManagedAnimation(id: string): AnimationController | undefined {
    return this._managedAnimations.get(id);
  }

  /**
   * Removes a managed animation from the service's tracking.
   * To be called when an animation's associated component is destroyed.
   */
  removeManagedAnimation(id: string): void {
    const controller = this._managedAnimations.get(id);
    if (controller) {
      controller.stop();
      this._managedAnimations.delete(id);
    }
  }

  get globalPauseState(): Signal<boolean> {
    return this._globalPauseState;
  }

  pauseAllAnimations(): void {
    this._globalPauseState.set(true);
  }

  resumeAllAnimations(): void {
    this._globalPauseState.set(false);
  }

  /** Gets a signal reflecting the current global animation playback rate. */
  get globalPlaybackRate(): Signal<number> {
    return this._globalPlaybackRate;
  }

  /** Sets a global playback rate for all managed animations. */
  setGlobalPlaybackRate(rate: number): void {
    this._globalPlaybackRate.set(rate);
  }

  /** Method for sequencing managed animations */
  sequenceAnimations(controllers: AnimationController[], callback?: () => Promise<void>): Promise<void> {
    let p = Promise.resolve();
    for (const controller of controllers) {
      p = p.then(() => {
        controller.play(); //Consider passing in a config object to handle directions/start state
        controller.finished.then(() => {
          callback?.();
        })
        return controller.finished;
      }).then(() => { });
    }
    return p;
  }

  /** Method for grouping animations for parallel playback */
  groupAnimations(controllers: AnimationController[]): Promise<Animation[]> {
    const promises = controllers.map(c => {
      c.play();
      return c.finished;
    });
    return Promise.all(promises);
  }

  public destroy(): void {
    if (this._cleanupGlobalPauseEffect) {
      this._cleanupGlobalPauseEffect();
      this._cleanupGlobalPauseEffect = null;
    }
    if (this._cleanupGlobalPlaybackRateEffect) {
      this._cleanupGlobalPlaybackRateEffect();
      this._cleanupGlobalPlaybackRateEffect = null;
    }
    if (this._mediaQueryList) {
      this._mediaQueryList.removeEventListener('change', (event: MediaQueryListEvent) => this._reducedMotion.set(event.matches));
      this._mediaQueryList = null;
    }
    this._managedAnimations.forEach(controller => controller.stop());
    this._managedAnimations.clear();
  }
}

