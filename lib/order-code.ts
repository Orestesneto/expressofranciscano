export function formatOrderCode(codigo: string) {
  const numero = codigo.match(/\d+$/)?.[0] ?? codigo;
  return `#EXPRESSO-${numero}`;
}
