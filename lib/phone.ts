const DEFAULT_DDD = '83';

export function normalizeBrazilianPhone(value: string): string | null {
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (digits.length === 8) {
    digits = `${DEFAULT_DDD}9${digits}`;
  } else if (digits.length === 9) {
    digits = `${DEFAULT_DDD}${digits}`;
  } else if (digits.length === 10) {
    digits = `${digits.slice(0, 2)}9${digits.slice(2)}`;
  }

  return /^\d{11}$/.test(digits) ? digits : null;
}
