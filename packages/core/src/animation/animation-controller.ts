import { signal, effect } from "@imbui/pulse";
import type { Signal } from "@imbui/pulse";
import type { LoggerService } from "../services/logger-service";

import type { AnimationService } from "../services/animation-service";

/**
 * Represents and controls a single Web Animation API animation instance.
 * Exposes methods for playback control and a signal for animation progress.
 */
export class AnimationController {
  private _animation: Animation;
  private _progressSignal: Signal<number>; //0.0 to 1.0, think runtime enforcement
  private _playStateSignal: Signal<AnimationPlayState>;
  private _pausedReasons: Set<'global' | 'component'> = new Set();

  private _cleanupGlobalPauseEffect: (() => void) | null = null;

  constructor(
    animation: Animation,
    animationService?: AnimationService,
    logger?: LoggerService,
  ) {
    this._animation = animation;

    const duration = this._animation.effect?.getComputedTiming().duration;

    this._progressSignal = signal(
      this._animation.currentTime !== null
      && typeof duration === 'number'
      && isFinite(duration)
      ? Number(this._animation.currentTime) / duration
      : 0
    );

    this._playStateSignal = signal(this._animation.playState);

    this._animation.onfinish = () => {
      this._playStateSignal.set('finished');
      this._progressSignal.set(1);
      this._pausedReasons.clear();
    };

    this._animation.oncancel = () => {
      this._playStateSignal.set('idle');
      this._progressSignal.set(0);
      this._pausedReasons.clear();;
    };

    this._animation.onremove = () => {
      this._cleanupGlobalPauseEffect?.();
    }

    if (animationService) {
      this._cleanupGlobalPauseEffect = effect(() => {
        const isGloballyPaused = animationService.globalPauseState.get();
        if (isGloballyPaused) {
          logger?.log(`[AnimationController] ${this._animation?.id || 'unnamed'} pausing due to global state.`);
          this.pause('global');
        } else {
          logger?.log(`[AnimationController] ${this._animation?.id || 'unnamed'} resuming due to global state.`);
        }
      });
    }
    logger?.warn(`Animation Controller instance contructed for ${animation.id || 'unnamed'}.`)
  }

  /**Gets the signal reflecting the current progress fo the animation (0.0 - 1.0). */
  get progress(): Signal<number> {
    return this._progressSignal;
  }

  /**Gets the signal reflecting if the animation is currently playing. */
  get playState(): Signal<AnimationPlayState> {
    return this._playStateSignal;
  }

  /**Gets the native WAAPI Animation object */
  get nativeAnimation(): Animation {
    return this._animation;
  }

  get finished(): Promise<Animation> {
    return this._animation.finished;
  }

  /** Starts/resumes the animation playback. */
  play(): void {
    if (this._animation) {
      this._pausedReasons.delete('component'); // Assume explicit play() means component wants it to play

      if (this._pausedReasons.size === 0) {
        this._animation.play();
        this._playStateSignal.set(this._animation.playState);
      }
    }
  }

  /**Pauses the animation playback. */
  pause(reason: 'global' | 'component'): void {
    if (this._animation && this._animation.playState === 'running') {
      this._pausedReasons.add(reason);
      this._animation.pause();
      this._playStateSignal.set(this._animation.playState);
    } else if (this._animation) {
      this._pausedReasons.add(reason);
    }
  }

  /**
   * Resumes the animation playback by removing a specific pause reason.
   * Only resumes if there are no otehr active pause reasons.
   * @param reason The reason to remove.
   */
  resume(reason: 'global' | 'component'): void {
    if (this._animation) {
      this._pausedReasons.delete(reason);
      if (this._pausedReasons.size === 0 && this._animation.playState === 'paused') {
        this._animation.play();
        this._playStateSignal.set(this._animation.playState);
      }
    }
  }

  /**Reverses the direction of the animation playback. */
  reverse(): void {
    if (this._animation) {
      this._animation.reverse();
      this._playStateSignal.set(this._animation.playState);
      this._playStateSignal.set(this._animation.playState);
      this._pausedReasons.clear();
      
    }
  }

  /**
   * Seeks the animation to a specific progress point (0.0 to 1.0).
   * Note: will not automatically play the animation unless it's already playing...
   */
  seek(progress: number): void {
    if (this._animation) {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const duration = this._animation.effect?.getComputedTiming().duration;
      if (typeof duration === 'number' && isFinite(duration) && duration > 0) {
        this._animation.currentTime = clampedProgress * duration;
        this._progressSignal.set(clampedProgress);

        if (this._animation.playState === 'running') {
          this._playStateSignal.set('running');
        } else {
          this._playStateSignal.set('paused');
        }
      }
    }
  }

  /**Stops the animation and resets the element to its initial state before the animation started.*/
  stop(): void {
    if (this._animation) {
      this._animation.cancel();
      this._playStateSignal.set('idle');
      this._progressSignal.set(0);
      this._pausedReasons.clear();
    }
  }

  /**Completes the animation immediately, jumping to its end state. */
  finish(): void {
    if (this._animation) {
      this._animation.finish();
    }
  }


}