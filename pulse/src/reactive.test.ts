import { describe, it, expect, vi, beforeEach} from 'vitest';
import { signal, effect, computed } from './reactive';

//Basic tests for signal
describe('reactive primitives', () => {

  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('signal', () => {
    it('should store and return the initial value', () => {
      //Arrange
      const initialValue = 'hello';
      const mySignal = signal(initialValue);
      //Act
      const value = mySignal.get();
      //Assert
      expect(value).toBe(initialValue);
    });

    it('should update the value and return the new value', async () => {
      //Arrange
      const mySignal = signal(0);
      const newValue = 100;
      //Act
      mySignal.set(newValue);
      const value = mySignal.get();
      //Assert
      expect(value).toBe(newValue)
    });
  });

  //Basic tests for effect
  describe('effect', () => {
    it('should run the effect function immediately on creation', async () => {
      //Arrange
      const callback = vi.fn(); //mock-function to track calls
      //Act
      effect(callback);
      //Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should re-run the effect when a tracked signal changes', async () => {
      //Arrange
      const mySignal = signal(0);
      const callback = vi.fn(() => mySignal.get());
      //Act
      effect(callback);
      mySignal.set(1);
      //Assert
      await vi.runAllTimersAsync();
      expect(callback).toHaveBeenCalledTimes(2);

      mySignal.set(2);
      await vi.runAllTimersAsync();
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it ('should not re-run if the signal value does not change', async () => {
      //Arrange
      const mySignal = signal(0);
      const callback = vi.fn(() => mySignal.get());
      //Act
      effect(callback);
      mySignal.set(0);
      await vi.runAllTimersAsync();
      //Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return a cleanup function that stops the effect from running', async () => {
      //Arrange
      const mySignal = signal(0);
      const callback = vi.fn(() => mySignal.get());
      //Act
      const stopEffect = effect(callback);
      mySignal.set(1);
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledTimes(2);

      stopEffect();
      mySignal.set(2);
      await vi.runAllTimersAsync();

      //Assert
      expect(callback).toHaveBeenCalledTimes(2); //only the initial run and first update
    });
  });

  describe('computed', () => {
    it('should compute the initial value correctly', () => {
      //Arrange
      const a = signal(1);
      const b = signal(2);
      //Act
      const sum = computed(() => a.get() + b.get());
      //Assert
      expect(sum.get()).toBe(3);
    });

    it('should update the computed value when its dependency changes', async () => {
      //Arrange
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.get() + b.get());
      //Act
      a.set(10);
      await vi.runAllTimersAsync();
      //Assert
      expect(sum.get()).toBe(12);
    });

    it('should only compute once for multiple changes within an effect', async () => {
      //Arrange
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.get() + b.get());
      const effectCallback = vi.fn(() => {
        sum.get();
      });

      //Act
      effect(effectCallback);
      expect(effectCallback).toHaveBeenCalledTimes(1);

      a.set(10);
      b.set(20);

      // First flush handles the computed's update
      await vi.runAllTimersAsync();

      // Second flush handles the effectCallback's update, which was queued by the computed's update
      await vi.runAllTimersAsync();

      //Assert
      expect(sum.get()).toBe(30);
      expect(effectCallback).toHaveBeenCalledTimes(2);
    })
  });
});