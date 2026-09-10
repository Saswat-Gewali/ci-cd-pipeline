/**
 * Pure calculation logic for the Tip and Bill Splitter.
 *
 * Nothing in this file touches the DOM, reads globals, or logs. Every function
 * takes values in and returns a value out, so the unit tests can call them
 * directly with no browser and no setup.
 *
 * Input policy: these functions are defensive because their real callers are
 * HTML inputs, which hand back strings and can be empty. Anything that is not a
 * usable non negative number is treated as 0 rather than producing NaN, so a
 * half filled form shows zeros instead of garbage.
 */

/**
 * Coerce a value to a usable non negative number.
 * Empty strings, NaN, Infinity, and negative numbers all collapse to 0.
 */
function toSafeNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

/**
 * Round a number to 2 decimal places (whole cents).
 *
 * Money in binary floating point is lossy: 2.675 is really stored as
 * 2.67499999999999982..., so a plain Math.round(2.675 * 100) gives 267 and
 * loses a cent. Passing through toFixed(4) first snaps the scaled value back to
 * the number a human wrote before we round it. Rounding is done on the absolute
 * value so that halves always go away from zero, making -1.005 round to -1.01
 * the same way 1.005 rounds to 1.01.
 *
 * @param {number} amount
 * @returns {number} the amount rounded to cents, 0 if the input is unusable
 */
export function roundToCents(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  const sign = parsed < 0 ? -1 : 1;
  const scaled = Number((Math.abs(parsed) * 100).toFixed(4));
  return (sign * Math.round(scaled)) / 100;
}

/**
 * The tip amount on its own.
 *
 * @param {number} bill total bill before the tip
 * @param {number} tipPercent tip rate as a percentage, so 15 means 15 percent
 * @returns {number} unrounded tip amount
 */
export function calculateTip(bill, tipPercent) {
  return (toSafeNumber(bill) * toSafeNumber(tipPercent)) / 100;
}

/**
 * The bill plus the tip.
 *
 * @param {number} bill total bill before the tip
 * @param {number} tipPercent tip rate as a percentage
 * @returns {number} unrounded grand total
 */
export function calculateTotal(bill, tipPercent) {
  return toSafeNumber(bill) + calculateTip(bill, tipPercent);
}

/**
 * Each person's share of a total.
 *
 * A head count is a whole number of people, so fractional values are truncated
 * (2.7 people means 2 people). Zero, negative, and unusable head counts return
 * 0 rather than dividing by zero and producing Infinity, which would render as
 * a meaningless value in the UI.
 *
 * The result is deliberately left unrounded. Rounding happens once, at display
 * time, in formatCurrency. Note that the rounded shares may not add back up to
 * the total: 100 split 3 ways displays as 33.33 each, which is 99.99. That last
 * penny is a real property of splitting money, not a bug.
 *
 * @param {number} total amount to divide
 * @param {number} people number of people sharing it
 * @returns {number} unrounded amount per person, 0 if people is not at least 1
 */
export function splitPerPerson(total, people) {
  const headCount = Math.trunc(Number(people));
  if (!Number.isFinite(headCount) || headCount < 0) {
    return 0;
  }
  return toSafeNumber(total) / headCount;
}

/**
 * Render an amount as a currency string, for example 1234.5 to "$1,234.50".
 *
 * Formatting is done by hand rather than with Intl.NumberFormat so that the
 * output does not change with the machine locale. A CI runner and a laptop must
 * produce the same string, otherwise the tests pass in one place and fail in
 * the other. Negative amounts put the sign before the symbol, as in "-$1.50".
 *
 * @param {number} amount
 * @returns {string} the formatted amount, "$0.00" if the input is unusable
 */
export function formatCurrency(amount) {
  const rounded = roundToCents(amount);
  const isNegative = rounded < 0;
  const [whole, cents] = Math.abs(rounded).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${isNegative ? '-' : ''}$${grouped}.${cents}`;
}
