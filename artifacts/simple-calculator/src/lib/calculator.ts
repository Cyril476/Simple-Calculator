export type Operator = '+' | '−' | '×' | '÷';

export type Term = {
  value: number;
  operator: Operator;
};

export type LastOperation = {
  operator: Operator;
  right: number;
};

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error';

  const rounded =
    Math.round((value + Math.sign(value) * Number.EPSILON) * 1e12) / 1e12;

  return Object.is(rounded, -0) ? '0' : String(rounded);
}

export function readNumber(value: string): number {
  return Number(value.replace(/,/g, ''));
}

export function calculate(
  left: number,
  right: number,
  operation: Operator,
): number | null {
  if (operation === '+') return left + right;
  if (operation === '−') return left - right;
  if (operation === '×') return left * right;
  if (right === 0) return null;
  return left / right;
}

export function evaluate(values: number[], operators: Operator[]): number | null {
  if (!values.length) return 0;

  const reducedValues = [values[0]];
  const reducedOperators: Operator[] = [];

  for (let index = 0; index < operators.length; index += 1) {
    const operation = operators[index];
    const nextValue = values[index + 1];

    if (operation === '×' || operation === '÷') {
      const left = reducedValues.pop()!;
      const result = calculate(left, nextValue, operation);
      if (result === null) return null;
      reducedValues.push(result);
    } else {
      reducedOperators.push(operation);
      reducedValues.push(nextValue);
    }
  }

  let result = reducedValues[0];
  for (let index = 0; index < reducedOperators.length; index += 1) {
    const nextResult = calculate(
      result,
      reducedValues[index + 1],
      reducedOperators[index],
    );
    if (nextResult === null) return null;
    result = nextResult;
  }

  return result;
}

export function expressionFromTerms(
  terms: Term[],
  trailingValue?: number,
): string {
  const parts: string[] = [];

  terms.forEach((term) => {
    parts.push(formatNumber(term.value), term.operator);
  });

  if (trailingValue !== undefined) {
    parts.push(formatNumber(trailingValue));
  }

  return parts.join(' ');
}