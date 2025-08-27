import { describe, it, expect, vi} from "vitest";
import { toText } from "./text";

describe('Text helper unit tests for text.ts', () => {

  describe('toText function', () => {

    it('should return a string when give a string.', () => {
      
      const testString = 'My test string.';
      const testResult = toText(testString);
  
      expect(testResult).toBeTypeOf('string');
      expect(testResult).toBe('My test string.');
      expect(testResult).toBe(testString);
    });
  
    it('should return a string when give a number', () => {
  
      const testNumber = 9;
      const testResult = toText(testNumber);
  
      expect(testResult).toBeTypeOf('string');
      expect(testResult).toBe('9');
      expect(testResult).toBe(String(testNumber));
    });
  
    it('should return a string when given JSON and not throw', () => {
  
      const testJson = { data: 'wow' };
      const testResult = toText(testJson);
  
      expect(testResult).toBeTypeOf('string');
      expect(testResult).toBe('{"data":"wow"}');
    });

    it("should convert booleans to string", () => {
      expect(toText(true)).toBe("true");
      expect(toText(false)).toBe("false");
    });

    it("should handle null and undefined consistently", () => {
      expect(toText(null)).toBe("");
      expect(toText(undefined)).toBe("")
    });

    it ("should stringify symbols safely", () => {
      expect(toText(Symbol("x"))).toBe("Symbol(x)");
    });

    it ("should stringify arrays", () => {
      expect(toText([1, 2, "hi"])).toContain("1");
    });

    it ("should stringify functions", () => {
      const fn = () => "ok";
      function fnVerbose() {return null};
      expect(toText(fn)).toContain("() =>")
      expect(toText(fnVerbose)).toContain("function");
    });

    it ("should respect custom stringify overrides", () => {
      const obj = {};
      const replacer = () => "custom!";
     
      expect(toText(obj, replacer)).toBe("custom!");
    });

    //non-serializable
    it("falls back gracefully on cyclic objects", () => {
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {};
      obj.self = obj;
      

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = toText(obj);

      expect(result).toBe("[object Object]");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("toText: failed to stringify"),
        expect.any(Error)
      );

      spy.mockRestore();
    });
  });
});