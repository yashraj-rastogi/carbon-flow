'use client';

import { motion } from 'framer-motion';

interface OdometerProps {
  /** The numeric value to display. */
  value: number;
}

/**
 * Physics-based rolling odometer digit display.
 * Renders each digit as an animated column that scrolls to the correct number
 * using spring physics via Framer Motion.
 *
 * Accessible: wraps the visual animation in an aria-label showing the actual value.
 */
export default function Odometer({ value }: OdometerProps) {
  const digits = value.toFixed(1).split('');
  const formattedValue = value.toFixed(1);

  return (
    <span
      className="inline-flex overflow-hidden h-8 items-center text-2xl font-extrabold text-zinc-100 font-mono"
      role="text"
      aria-label={`${formattedValue} kilograms`}
    >
      {digits.map((digit, i) => {
        if (digit === '.') {
          return (
            <span key={`dot-${i}`} className="px-0.5" aria-hidden="true">
              .
            </span>
          );
        }
        const parsedDigit = parseInt(digit);
        if (isNaN(parsedDigit)) {
          return (
            <span key={`char-${i}`} aria-hidden="true">
              {digit}
            </span>
          );
        }
        return (
          <span
            key={`digit-${i}`}
            className="relative h-8 w-[14px] overflow-hidden inline-block text-center"
            aria-hidden="true"
          >
            <motion.span
              className="absolute left-0 right-0 flex flex-col"
              initial={{ y: 0 }}
              animate={{ y: -parsedDigit * 32 }}
              transition={{ type: 'spring', stiffness: 90, damping: 14 }}
              style={{ height: '320px', lineHeight: '32px' }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span key={num} className="h-8 block text-center select-none">
                  {num}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
