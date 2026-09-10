import { describe, it, expect } from 'vitest';
import {
  roundToCents,
  calculateTip,
  calculateTotal,
  splitPerPerson,
  formatCurrency,
} from './logic.js';

describe('roundToCents', () => {
  it('leaves an amount that is already in whole cents alone', () => {
    expect(roundToCents(12.34)).toBe(12.34);
  });

  it('rounds a half cent up, despite floating point storage', () => {
    // 1.005 is stored as 1.00499999999999989, so a naive Math.round gives 1.00.
    expect(roundToCents(1.005)).toBe(1.01);
    expect(roundToCents(2.675)).toBe(2.68);
  });

  it('rounds down below the half cent', () => {
    expect(roundToCents(4.9949)).toBe(4.99);
  });

  it('rounds negative halves away from zero, mirroring positives', () => {
    expect(roundToCents(-1.005)).toBe(-1.01);
  });

  it('returns 0 for values that are not finite numbers', () => {
    expect(roundToCents(NaN)).toBe(0);
    expect(roundToCents(Infinity)).toBe(0);
    expect(roundToCents('not a number')).toBe(0);
  });
});

describe('calculateTip', () => {
  it('takes the given percentage of the bill', () => {
    expect(calculateTip(100, 15)).toBe(15);
    expect(calculateTip(50, 20)).toBe(10);
  });

  it('returns 0 when the bill is 0', () => {
    expect(calculateTip(0, 20)).toBe(0);
  });

  it('returns 0 when the tip percentage is 0', () => {
    expect(calculateTip(100, 0)).toBe(0);
  });

  it('handles fractional bills and rates without rounding early', () => {
    expect(calculateTip(85.5, 18)).toBeCloseTo(15.39, 10);
    expect(calculateTip(33.33, 15)).toBeCloseTo(4.9995, 10);
  });

  it('accepts numeric strings, because HTML inputs hand back strings', () => {
    expect(calculateTip('100', '15')).toBe(15);
  });

  it('treats empty, negative, and unusable inputs as 0', () => {
    expect(calculateTip('', 15)).toBe(0);
    expect(calculateTip(-100, 15)).toBe(0);
    expect(calculateTip(100, -15)).toBe(0);
    expect(calculateTip('abc', 15)).toBe(0);
  });
});

describe('calculateTotal', () => {
  it('adds the tip to the bill', () => {
    expect(calculateTotal(100, 15)).toBe(115);
    expect(calculateTotal(80, 25)).toBe(100);
  });

  it('equals the bill when the tip percentage is 0', () => {
    expect(calculateTotal(42.5, 0)).toBe(42.5);
  });

  it('returns 0 when the bill is 0', () => {
    expect(calculateTotal(0, 20)).toBe(0);
  });

  it('stays consistent with calculateTip', () => {
    const bill = 63.47;
    const tipPercent = 18;
    expect(calculateTotal(bill, tipPercent)).toBeCloseTo(
      bill + calculateTip(bill, tipPercent),
      10,
    );
  });

  it('treats unusable input as 0', () => {
    expect(calculateTotal('', '')).toBe(0);
    expect(calculateTotal(NaN, 15)).toBe(0);
  });
});

describe('splitPerPerson', () => {
  it('divides the total evenly', () => {
    expect(splitPerPerson(115, 5)).toBe(23);
  });

  it('returns the whole total for a single person', () => {
    expect(splitPerPerson(57.25, 1)).toBe(57.25);
  });

  it('returns 0 for zero people instead of dividing by zero', () => {
    expect(splitPerPerson(115, 0)).toBe(0);
  });

  it('returns 0 for negative or unusable head counts', () => {
    expect(splitPerPerson(115, -3)).toBe(0);
    expect(splitPerPerson(115, '')).toBe(0);
    expect(splitPerPerson(115, 'four')).toBe(0);
  });

  it('truncates a fractional head count to whole people', () => {
    expect(splitPerPerson(100, 2.7)).toBe(50);
  });

  it('returns 0 when there is nothing to split', () => {
    expect(splitPerPerson(0, 4)).toBe(0);
  });

  it('keeps the repeating remainder unrounded for the caller', () => {
    expect(splitPerPerson(100, 3)).toBeCloseTo(33.333333, 5);
  });
});

describe('formatCurrency', () => {
  it('always shows two decimal places', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(5)).toBe('$5.00');
    expect(formatCurrency(12.5)).toBe('$12.50');
  });

  it('rounds to the nearest cent', () => {
    expect(formatCurrency(1.005)).toBe('$1.01');
    expect(formatCurrency(33.333333)).toBe('$33.33');
    expect(formatCurrency(4.996)).toBe('$5.00');
  });

  it('groups thousands with commas', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(1234567.891)).toBe('$1,234,567.89');
  });

  it('puts the sign before the symbol for negative amounts', () => {
    expect(formatCurrency(-1.5)).toBe('-$1.50');
  });

  it('never renders a negative zero', () => {
    expect(formatCurrency(-0.001)).toBe('$0.00');
  });

  it('falls back to $0.00 for unusable input', () => {
    expect(formatCurrency(NaN)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
    expect(formatCurrency('abc')).toBe('$0.00');
  });
});

describe('the functions working together', () => {
  it('splits a 100 bill at 15 percent between 3 people', () => {
    const total = calculateTotal(100, 15);
    expect(formatCurrency(calculateTip(100, 15))).toBe('$15.00');
    expect(formatCurrency(total)).toBe('$115.00');
    expect(formatCurrency(splitPerPerson(total, 3))).toBe('$38.33');
  });

  it('shows zeros for an empty form rather than NaN', () => {
    const total = calculateTotal('', '');
    expect(formatCurrency(total)).toBe('$0.00');
    expect(formatCurrency(splitPerPerson(total, ''))).toBe('$0.00');
  });
});

describe('a 0 percent tip', () => {
  it('produces no tip at all', () => {
    expect(calculateTip(89.99, 0)).toBe(0);
    expect(calculateTip(0.01, 0)).toBe(0);
    expect(calculateTip(1000000, 0)).toBe(0);
  });

  it('leaves the total exactly equal to the bill', () => {
    expect(calculateTotal(89.99, 0)).toBe(89.99);
    expect(calculateTotal(0.01, 0)).toBe(0.01);
  });

  it('adds nothing even when the bill has awkward decimals', () => {
    // A 0 percent tip must not introduce any floating point drift of its own,
    // so the total has to come back byte for byte identical to the bill.
    const bill = 63.47;
    expect(calculateTotal(bill, 0)).toBe(bill);
  });

  it('accepts "0" as a string, which is what an input field sends', () => {
    expect(calculateTip(100, '0')).toBe(0);
    expect(calculateTotal(100, '0')).toBe(100);
  });

  it('still splits the bare bill between people', () => {
    const total = calculateTotal(90, 0);
    expect(splitPerPerson(total, 3)).toBe(30);
    expect(formatCurrency(splitPerPerson(total, 3))).toBe('$30.00');
  });

  it('runs end to end with no tip', () => {
    const bill = 89.99;
    const total = calculateTotal(bill, 0);
    expect(formatCurrency(calculateTip(bill, 0))).toBe('$0.00');
    expect(formatCurrency(total)).toBe('$89.99');
    expect(formatCurrency(splitPerPerson(total, 2))).toBe('$45.00');
  });
});

describe('a bill that does not divide evenly', () => {
  it('gives every person the same repeating share', () => {
    // 100 / 3 never terminates, so each share is the same unrounded number and
    // the display rounding is what makes them look like whole cents.
    const perPerson = splitPerPerson(100, 3);
    expect(perPerson).toBeCloseTo(33.333333, 6);
    expect(formatCurrency(perPerson)).toBe('$33.33');
  });

  it('collects one cent less than the total when shares round down', () => {
    const total = calculateTotal(100, 15);
    const perPerson = roundToCents(splitPerPerson(total, 3));
    expect(perPerson).toBe(38.33);
    // 3 x 38.33 is 114.99, a penny short of 115. This is the real behaviour of
    // splitting money, so the UI reports the gap instead of hiding it.
    expect(roundToCents(perPerson * 3)).toBe(114.99);
    expect(roundToCents(total - perPerson * 3)).toBe(0.01);
  });

  it('collects more than the total when shares round up', () => {
    const perPerson = roundToCents(splitPerPerson(100, 7));
    expect(perPerson).toBe(14.29);
    // 7 x 14.29 is 100.03, three cents over.
    expect(roundToCents(perPerson * 7)).toBe(100.03);
    expect(roundToCents(perPerson * 7 - 100)).toBe(0.03);
  });

  it('rounds a share that lands exactly on half a cent', () => {
    // 55.55 / 2 is 27.775 exactly, so the half cent rounds away from zero.
    expect(splitPerPerson(55.55, 2)).toBe(27.775);
    expect(formatCurrency(splitPerPerson(55.55, 2))).toBe('$27.78');
  });

  it('handles an uneven split of a bill that already has a tip', () => {
    const total = calculateTotal(85.75, 18);
    expect(total).toBeCloseTo(101.185, 10);
    expect(formatCurrency(total)).toBe('$101.19');
    expect(formatCurrency(splitPerPerson(total, 4))).toBe('$25.30');
  });

  it('divides an odd amount between an odd number of people', () => {
    expect(formatCurrency(splitPerPerson(10, 3))).toBe('$3.33');
    expect(formatCurrency(splitPerPerson(0.1, 3))).toBe('$0.03');
  });

  it('splits a total smaller than the head count without going negative', () => {
    // 4 people sharing 1 cent: each share rounds to 0.00, never below zero.
    const perPerson = splitPerPerson(0.01, 4);
    expect(perPerson).toBeGreaterThan(0);
    expect(formatCurrency(perPerson)).toBe('$0.00');
  });
});

describe('formatCurrency always shows exactly two decimal places', () => {
  const twoDecimals = /^-?\$[\d,]+\.\d{2}$/;

  it('pads a whole number with .00', () => {
    expect(formatCurrency(7)).toBe('$7.00');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('pads a single decimal place with a trailing zero', () => {
    expect(formatCurrency(7.5)).toBe('$7.50');
    expect(formatCurrency(0.1)).toBe('$0.10');
    expect(formatCurrency(1.1)).toBe('$1.10');
  });

  it('cuts a long decimal tail down to two places', () => {
    expect(formatCurrency(5.126)).toBe('$5.13');
    expect(formatCurrency(2.0001)).toBe('$2.00');
    expect(formatCurrency(0.005)).toBe('$0.01');
    expect(formatCurrency(0.004)).toBe('$0.00');
  });

  it('matches the two decimal shape for every kind of input', () => {
    const samples = [0, 1, 7.5, 5.126, 33.333333, 1234.5, 1234567.891, -1.5, NaN, 'abc', undefined];
    for (const sample of samples) {
      expect(formatCurrency(sample)).toMatch(twoDecimals);
    }
  });

  it('keeps the two decimal shape for anything the calculators produce', () => {
    // Guards the seam between the two halves of the module: whatever raw number
    // the calculations return, the display is always well formed.
    const cases = [
      [100, 15, 3],
      [85.75, 18, 4],
      [0.01, 0, 7],
      [1999.99, 22, 6],
    ];
    for (const [bill, tipPercent, people] of cases) {
      const total = calculateTotal(bill, tipPercent);
      expect(formatCurrency(calculateTip(bill, tipPercent))).toMatch(twoDecimals);
      expect(formatCurrency(total)).toMatch(twoDecimals);
      expect(formatCurrency(splitPerPerson(total, people))).toMatch(twoDecimals);
    }
  });
});
