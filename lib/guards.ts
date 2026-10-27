// Serein never takes card numbers, CVVs, PINs or full account numbers.
const LONG_NUMBER = /([0-9][ -]?){12,}/;

export const looksLikeLongNumber = (value: string) => LONG_NUMBER.test(value);

export const LONG_NUMBER_WARNING =
  "That looks like a card or account number. Serein never stores those. Keep the last four digits at most.";
