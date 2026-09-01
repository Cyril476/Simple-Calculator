import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Delete, Keyboard } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  calculate,
  evaluate,
  expressionFromTerms,
  formatNumber,
  readNumber,
  type LastOperation,
  type Operator,
  type Term,
} from '@/lib/calculator';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type HistoryItem = {
  id: number;
  expression: string;
  result: string;
};

const queryClient = new QueryClient();
const operatorSymbols: Record<Operator, string> = {
  '+': '+',
  '−': '−',
  '×': '×',
  '÷': '÷',
};

function Home() {
  const [display, setDisplay] = useState('0');
  const [terms, setTerms] = useState<Term[]>([]);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('Ready for input');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastOperation, setLastOperation] = useState<LastOperation | null>(
    null,
  );
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  const press = useCallback((key: string) => {
    setPressedKey(key);
    window.setTimeout(
      () => setPressedKey((current) => (current === key ? null : current)),
      130,
    );
  }, []);

  const animateValue = useCallback(
    () => setPulse((current) => current + 1),
    [],
  );

  const handleDigit = useCallback(
    (digit: string) => {
      press(digit);
      animateValue();

      if (display === 'Cannot divide by zero') {
        setDisplay(digit);
        setExpression('Ready for input');
        setTerms([]);
        setOperator(null);
        setLastOperation(null);
        setWaitingForOperand(false);
        return;
      }

      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
        if (!terms.length) setExpression('Ready for input');
        setLastOperation(null);
        return;
      }

      if (display === '-0') {
        setDisplay(`-${digit}`);
        return;
      }

      if (display === '0') {
        setDisplay(digit);
        return;
      }

      if (display.replace('-', '').replace('.', '').length >= 16) return;
      setDisplay(`${display}${digit}`);
    },
    [animateValue, display, press, terms.length, waitingForOperand],
  );

  const handleDecimal = useCallback(() => {
    press('.');
    animateValue();

    if (display === 'Cannot divide by zero') {
      setDisplay('0.');
      setExpression('Ready for input');
      setTerms([]);
      setOperator(null);
      setLastOperation(null);
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      if (!terms.length) setExpression('Ready for input');
      setLastOperation(null);
      return;
    }

    if (!display.includes('.')) setDisplay(`${display}.`);
  }, [
    animateValue,
    display,
    press,
    terms.length,
    waitingForOperand,
  ]);

  const handleOperator = useCallback(
    (nextOperator: Operator) => {
      press(nextOperator);
      animateValue();

      if (display === 'Cannot divide by zero') return;

      const currentValue = readNumber(display);
      if (waitingForOperand && terms.length) {
        const updatedTerms = terms.map((term, index) =>
          index === terms.length - 1
            ? { ...term, operator: nextOperator }
            : term,
        );
        setTerms(updatedTerms);
        setOperator(nextOperator);
        setExpression(expressionFromTerms(updatedTerms));
        return;
      }

      const updatedTerms = [
        ...terms,
        { value: currentValue, operator: nextOperator },
      ];
      setTerms(updatedTerms);
      setOperator(nextOperator);
      setExpression(expressionFromTerms(updatedTerms));
      setWaitingForOperand(true);
      setLastOperation(null);
    },
    [
      animateValue,
      display,
      press,
      terms,
      waitingForOperand,
    ],
  );

  const handleEquals = useCallback(() => {
    press('=');
    animateValue();

    if (display === 'Cannot divide by zero') return;

    if (!terms.length && lastOperation) {
      const left = readNumber(display);
      const result = calculate(left, lastOperation.right, lastOperation.operator);
      const readableExpression = `${formatNumber(left)} ${operatorSymbols[lastOperation.operator]} ${formatNumber(lastOperation.right)}`;

      if (result === null) {
        setDisplay('Cannot divide by zero');
        setExpression(`${readableExpression} =`);
        setLastOperation(null);
        setWaitingForOperand(true);
        return;
      }

      const formatted = formatNumber(result);
      setHistory((items) =>
        [
          {
            id: Date.now(),
            expression: readableExpression,
            result: formatted,
          },
          ...items,
        ].slice(0, 4),
      );
      setDisplay(formatted);
      setExpression(`${readableExpression} =`);
      setWaitingForOperand(true);
      return;
    }

    if (!terms.length) return;

    const right = readNumber(display);
    const values = [...terms.map((term) => term.value), right];
    const operators = terms.map((term) => term.operator);
    const result = evaluate(values, operators);
    const readableExpression = `${expressionFromTerms(terms)} ${formatNumber(right)}`;
    const repeatedOperation = {
      operator: operators[operators.length - 1],
      right,
    };

    if (result === null) {
      setDisplay('Cannot divide by zero');
      setExpression(`${readableExpression} =`);
      setTerms([]);
      setOperator(null);
      setLastOperation(null);
      setWaitingForOperand(true);
      return;
    }

    const formatted = formatNumber(result);
    setHistory((items) =>
      [
        {
          id: Date.now(),
          expression: readableExpression,
          result: formatted,
        },
        ...items,
      ].slice(0, 4),
    );
    setDisplay(formatted);
    setExpression(`${readableExpression} =`);
    setTerms([]);
    setOperator(null);
    setLastOperation(repeatedOperation);
    setWaitingForOperand(true);
  }, [
    animateValue,
    display,
    lastOperation,
    press,
    terms,
  ]);

  const handleClear = useCallback(() => {
    press('clear');
    setDisplay('0');
    setTerms([]);
    setOperator(null);
    setLastOperation(null);
    setWaitingForOperand(false);
    setExpression('Ready for input');
  }, [press]);

  const handleBackspace = useCallback(() => {
    press('backspace');
    animateValue();
    if (waitingForOperand || display === 'Cannot divide by zero') return;
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
      return;
    }
    setDisplay(display.slice(0, -1));
  }, [animateValue, display, press, waitingForOperand]);

  const handleSign = useCallback(() => {
    press('sign');
    animateValue();
    if (display === 'Cannot divide by zero') return;

    if (waitingForOperand) {
      if (!terms.length) {
        const nextDisplay = display.startsWith('-')
          ? display.slice(1)
          : `-${display}`;
        setDisplay(nextDisplay === '' ? '0' : nextDisplay);
        setExpression('Ready for input');
        setWaitingForOperand(false);
      } else {
        setDisplay('-0');
        setWaitingForOperand(false);
      }
      return;
    }

    if (display === '0') {
      setDisplay('-0');
      return;
    }
    setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
  }, [animateValue, display, press, terms.length, waitingForOperand]);

  const handlePercent = useCallback(() => {
    press('%');
    animateValue();
    if (display === 'Cannot divide by zero') return;
    const percentage = readNumber(display) / 100;
    setDisplay(formatNumber(percentage));
    setWaitingForOperand(false);
    if (!terms.length) setExpression('Ready for input');
  }, [animateValue, display, press, terms.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      if (/^\d$/.test(key)) {
        event.preventDefault();
        handleDigit(key);
      } else if (key === '.') {
        event.preventDefault();
        handleDecimal();
      } else if (key === '+' || key === '-') {
        event.preventDefault();
        handleOperator(key === '-' ? '−' : '+');
      } else if (key === '*' || key.toLowerCase() === 'x') {
        event.preventDefault();
        handleOperator('×');
      } else if (key === '/') {
        event.preventDefault();
        handleOperator('÷');
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        handleEquals();
      } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        event.preventDefault();
        handleClear();
      } else if (key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
      } else if (key === '%') {
        event.preventDefault();
        handlePercent();
      } else if (key.toLowerCase() === 'n') {
        event.preventDefault();
        handleSign();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleBackspace,
    handleClear,
    handleDecimal,
    handleDigit,
    handleEquals,
    handleOperator,
    handlePercent,
    handleSign,
  ]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => Promise<void> } | undefined;
    const setupBackButton = async () => {
      listener = await CapacitorApp.addListener(
        'backButton',
        ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else if (
            display !== '0' ||
            Boolean(terms.length || operator)
          ) {
            handleClear();
          } else {
            void CapacitorApp.exitApp();
          }
        },
      );
    };

    void setupBackButton();
    return () => {
      void listener?.remove();
    };
  }, [display, handleClear, operator, terms.length]);

  const numberKey = (digit: string) => (
    <button
      key={digit}
      type="button"
      className={`calc-key ${pressedKey === digit ? 'is-pressed' : ''}`}
      onClick={() => handleDigit(digit)}
      aria-label={`Digit ${digit}`}
      data-testid={`button-digit-${digit}`}
    >
      {digit}
    </button>
  );

  const operatorKey = (value: Operator, hint: string) => (
    <button
      key={value}
      type="button"
      className={`calc-key operator ${operator === value ? 'is-active' : ''} ${pressedKey === value ? 'is-pressed' : ''}`}
      onClick={() => handleOperator(value)}
      aria-label={`Operator ${value}`}
      data-testid={`button-operator-${value}`}
    >
      {value}
      <span className="key-hint">{hint}</span>
    </button>
  );

  const statusLabel =
    display === 'Cannot divide by zero'
      ? 'Check input'
      : operator
        ? 'In progress'
        : 'Ready';

  return (
    <main className="instrument-page">
      <div className="instrument-shell">
        <section className="brand-lockup" aria-label="Calculator introduction">
          <div className="brand-mark" aria-hidden="true">+−</div>
          <p className="eyebrow">Everyday instrument / 01</p>
          <h1 className="brand-title">Good math,<br />no fuss.</h1>
          <p className="brand-copy">A small, considered calculator for the numbers that keep your day moving.</p>
          <div className="shortcut-note">
            <Keyboard size={14} strokeWidth={1.7} aria-hidden="true" />
            <span>Keyboard ready</span>
            <kbd>1</kbd><kbd>+</kbd><kbd>↵</kbd>
          </div>
        </section>

        <section className="calculator-frame" aria-label="Calculator">
          <div className="display-section">
            <div className="display-topline">
              <span className="panel-kicker">Precision / live</span>
              <span className="display-status"><span className="status-dot" /> {statusLabel}</span>
            </div>
            <div className="expression-line" data-testid="text-expression" aria-live="polite">{expression}</div>
            <div
              key={pulse}
              className={`current-value ${pulse ? 'value-pulse' : ''} ${display === 'Cannot divide by zero' ? 'is-error' : ''}`}
              data-testid="text-current-value"
              aria-live="polite"
            >
              {display}
            </div>
          </div>

          <div className="keypad-section">
            <div className="keypad">
              <button
                type="button"
                className={`calc-key utility ${pressedKey === 'clear' ? 'is-pressed' : ''}`}
                onClick={handleClear}
                aria-label="Clear calculator"
                data-testid="button-clear"
              >
                AC
                <span className="key-hint">esc</span>
              </button>
              <button
                type="button"
                className={`calc-key utility ${pressedKey === 'backspace' ? 'is-pressed' : ''}`}
                onClick={handleBackspace}
                aria-label="Backspace"
                data-testid="button-backspace"
              >
                <Delete size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="key-hint">del</span>
              </button>
              <button
                type="button"
                className={`calc-key utility ${pressedKey === '%' ? 'is-pressed' : ''}`}
                onClick={handlePercent}
                aria-label="Percent"
                data-testid="button-percent"
              >
                %
              </button>
              {operatorKey('÷', '/')}
              {numberKey('7')}{numberKey('8')}{numberKey('9')}{operatorKey('×', '*')}
              {numberKey('4')}{numberKey('5')}{numberKey('6')}{operatorKey('−', '−')}
              {numberKey('1')}{numberKey('2')}{numberKey('3')}{operatorKey('+', '+')}
              <button
                type="button"
                className={`calc-key zero ${pressedKey === '0' ? 'is-pressed' : ''}`}
                onClick={() => handleDigit('0')}
                aria-label="Digit 0"
                data-testid="button-digit-0"
              >
                0
              </button>
              <button
                type="button"
                className={`calc-key ${pressedKey === '.' ? 'is-pressed' : ''}`}
                onClick={handleDecimal}
                aria-label="Decimal point"
                data-testid="button-decimal"
              >
                .
              </button>
              <button
                type="button"
                className={`calc-key equals ${pressedKey === '=' ? 'is-pressed' : ''}`}
                onClick={handleEquals}
                aria-label="Equals"
                data-testid="button-equals"
              >
                =
                <span className="key-hint">enter</span>
              </button>
              <button
                type="button"
                className={`calc-key utility ${pressedKey === 'sign' ? 'is-pressed' : ''}`}
                onClick={handleSign}
                aria-label="Toggle positive or negative"
                data-testid="button-sign-toggle"
              >
                +/−
                <span className="key-hint">n</span>
              </button>
            </div>
          </div>

          <div className="history-section">
            <div className="history-heading">
              <h2>Recent calculations</h2>
              <span data-testid="text-history-count">{history.length ? `${history.length} saved` : 'No saved work'}</span>
            </div>
            <div className="history-list" aria-live="polite">
              {history.length === 0 ? (
                <p className="history-empty" data-testid="text-history-empty">Your completed sums will appear here.</p>
              ) : history.map((item) => (
                <div className="history-row" key={item.id} data-testid={`row-history-${item.id}`}>
                  <span className="history-expression">{item.expression}</span>
                  <span className="history-result">= {item.result}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const appBase =
    import.meta.env.BASE_URL === './'
      ? ''
      : import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={appBase}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;