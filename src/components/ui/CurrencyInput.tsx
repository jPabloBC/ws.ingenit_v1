'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { getCurrencyPrefs } from '@/lib/currency';
import { parseCurrencyInput } from '@/lib/currency';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, className = '', ...rest }) => {
  const prefs = useMemo(() => getCurrencyPrefs(), []);
  const [display, setDisplay] = useState('');

  const formatForInput = (n: number) => {
    const { locale, fractionDigits } = prefs as any;
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: typeof fractionDigits === 'number' ? fractionDigits : undefined,
      maximumFractionDigits: typeof fractionDigits === 'number' ? fractionDigits : undefined,
    }).format(isNaN(n) ? 0 : n);
  };

  useEffect(() => {
    setDisplay(formatForInput(value || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = parseCurrencyInput(raw);
    setDisplay(raw);
    onChange(numeric);
  };

  const handleBlur = () => {
    const numeric = parseCurrencyInput(display);
    setDisplay(formatForInput(numeric));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  );
};

export default CurrencyInput;





