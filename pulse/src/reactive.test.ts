import { describe, it, expect, vi } from 'vitest';
import { signal, effect } from './reactive';

//Basic tests for signal
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

  it('should update the value and return the new value', () => {
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
  it('should run the effect function immediately on creation', () => {
    //Arrange
    const callback = vi.fn(); //mock-function to track calls
    //Act
    effect(callback);
    //Assert
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should re-run the effect when a tracked signal changes', () => {
    //Arrange
    const mySignal = signal(0);
    const callback = vi.fn(() => mySignal.get());
    //Act
    effect(callback);
    mySignal.set(1);
    //Assert
    expect(callback).toHaveBeenCalledTimes(2);
    mySignal.set(2);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it ('should not re-run if the signal value does not change', () => {
    //Arrange
    const mySignal = signal(0);
    const callback = vi.fn(() => mySignal.get());
    //Act
    effect(callback);
    mySignal.set(0);
    //Assert
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should return a cleanup function that stops the effect from running', () => {
    //Arrange
    const mySignal = signal(0);
    const callback = vi.fn(() => mySignal.get());
    //Act
    const stopEffect = effect(callback);
    mySignal.set(1);
    stopEffect();
    mySignal.set(2);

    //Assert
    expect(callback).toHaveBeenCalledTimes(2); //only the initial run and first update
  });
});

// describe('computed', () => {
//   it('should compute the initial value correctly', () => {
//     //Arrange
//     const a = signal(1);
//     const b = signal(2);
//     //Act
//     const sum = computed(() => a.get() + b.get());
//     //Assert
//     expect(sum.get()).toBe(3);
//   });

//   it('should update the computed value when its dependency changes', () => {
//     //Arrange
//     const a = signal(1);
//     const b = signal(2);
//     const sum = computed(() => a.get() + b.get());
//     //Act
//     a.set(10);
//     //Assert
//     expect(sum.get()).toBe(12);
//   });

//   it('should only compute once for multiple changes within an effect', () => {
//     //Arrange
//     const a = signal(1);
//     const b = signal(2);
//     const sum = computed(() => a.get() + b.get());
//     const effectCallback = vi.fn(() => {
//       sum.get();
//     });

//     //Act
//     effect(effectCallback);
//     a.set(10);
//     b.set(20);
//     /**
//      * Assert
//      * The effect should only run once for the initial value and then once for the
//      * final updated value.
//      * The `computed` value itself will update internally between `a.set` and `b.set`,
//      * but the effect only reacts to the final state.
//      */
//     expect(effectCallback).toHaveBeenCalledTimes(2);
//     expect(sum.get()).toBe(30);
//   })
// });