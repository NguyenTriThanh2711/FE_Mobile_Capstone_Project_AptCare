export function capitalizeFirst(input ) {
  if (!input) return '';
  const cp = input.codePointAt(0);
  if (cp === undefined) return '';
  const first = String.fromCodePoint(cp).toUpperCase();
  const rest = input.slice(first.length);
  return first + rest;
}