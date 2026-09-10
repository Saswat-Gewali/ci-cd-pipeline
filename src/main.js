/**
 * User interface layer.
 *
 * This file owns everything the calculation logic must not know about: reading
 * the inputs, writing the results back into the page, and wiring up events. All
 * the arithmetic is imported from logic.js, which is why logic.js can be unit
 * tested without a browser.
 */

import {
  calculateTip,
  calculateTotal,
  splitPerPerson,
  formatCurrency,
  roundToCents,
} from './logic.js';

// Look the elements up once, not on every keystroke.
const billInput = document.querySelector('#bill');
const tipInput = document.querySelector('#tip');
const peopleInput = document.querySelector('#people');

const tipOutput = document.querySelector('#tip-amount');
const totalOutput = document.querySelector('#total-amount');
const perPersonOutput = document.querySelector('#per-person');
const note = document.querySelector('#note');

/**
 * Read the form, run the calculations, and paint the results.
 *
 * The input values are passed through as raw strings on purpose. The logic
 * functions already coerce them and fall back to 0, so a half filled form shows
 * zeros instead of NaN and there is no parsing duplicated here.
 */
function render() {
  const bill = billInput.value;
  const tipPercent = tipInput.value;
  const people = peopleInput.value;

  const tip = calculateTip(bill, tipPercent);
  const total = calculateTotal(bill, tipPercent);
  const perPerson = splitPerPerson(total, people);

  tipOutput.textContent = formatCurrency(tip);
  totalOutput.textContent = formatCurrency(total);
  perPersonOutput.textContent = formatCurrency(perPerson);

  note.textContent = buildNote(total, people, perPerson);
}

/**
 * A short explanatory line under the results.
 *
 * It covers the two cases a bare number cannot: an unusable head count, and the
 * rounding gap where the displayed shares do not add back up to the total.
 */
function buildNote(total, people, perPerson) {
  const headCount = Math.trunc(Number(people));
  if (!Number.isFinite(headCount) || headCount < 1) {
    return 'Enter at least 1 person to split the bill.';
  }

  const collected = roundToCents(roundToCents(perPerson) * headCount);
  const shortfall = roundToCents(total - collected);
  if (shortfall !== 0) {
    const direction = shortfall > 0 ? 'short by' : 'over by';
    return `Rounded shares come out ${direction} ${formatCurrency(Math.abs(shortfall))}.`;
  }

  return `Split evenly between ${headCount} ${headCount === 1 ? 'person' : 'people'}.`;
}

// Recalculate as the user types, and once on load so the page is never blank.
for (const input of [billInput, tipInput, peopleInput]) {
  input.addEventListener('input', render);
}

render();
