export const shortenLabel = (label, maxLength) => {
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength - 3).trim() + '...';
}