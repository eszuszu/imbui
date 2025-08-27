import { describe, it, expect, afterEach, vi } from "vitest";
import { looksLikeAttrOpen, looksLikeChildSlot } from "./parsing";
describe('Parsing helper unit tests for parsing.ts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unit tests for looksLikeAttrOpen function', () => {
    
    it('should return true when give a single opening html glyph "<".', () => {
      const result = looksLikeAttrOpen('<div');
      expect(result).toBe(true);
    });

    it('should return false when given a complete matching html glyph pair, i.e. "< >"', () => {
      const result = looksLikeAttrOpen('<div>');
      expect(result).toBe(false);
    });

    it('should match single words within open tags with or without a preceding `=` i.e., "disabled"', () => {
      const result = looksLikeAttrOpen('<div disabled');
      expect(result).toBe(true);
    });

    it("does not match against arbitrary text outside of tags", () => {
      const result = looksLikeAttrOpen('<div>wow');
      expect(result).toBe(false);
    });

  });

  describe('Unit tests for looksLikeChildSlot function', () => {
    const closedOpenSubstrings = ['>foo', '<bar']
    it('should return true when given a substring containing the closing glyph followed by an opening as its arguments ">","<"', () => {
      const [closed, open] = closedOpenSubstrings;
      const result = looksLikeChildSlot(closed, open)
      expect(result).toBe(true);
    });

    it('should treat syntax like `<div foo=>${slot}</div>` as valid attribute context.', () => {
      const result = looksLikeChildSlot(`<div foo=>`,`</div>`);
      expect(result).toBe(true);
    });

    it('should correctly identify slots following self-closing tags as not part of attribute context', () => {
      const result = looksLikeChildSlot(`<img src="x"/>`, '');
      expect(result).toBe(false);
    });

    it('correctly identifies child slots between nested HTML tags', () => {
      const result = looksLikeChildSlot(`<div>`, `<span>`);
      expect(result).toBe(true);
    });

    it('identifies likely cases', () => {
      expect(looksLikeChildSlot('<div>','</div>')).toBe(true);
    });

  });
});