import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { formatNumericValue, parseNumericText, sanitizeNumericText } from "../lib/numeric-text";

export interface NumericInputProps extends Omit<
  TextInputProps,
  "value" | "onChangeText" | "keyboardType"
> {
  /** Committed numeric value. `undefined`/`null` render as an empty field. */
  value: number | null | undefined;
  /** Fired whenever the draft text parses to a different number. */
  onChangeValue: (value: number | undefined) => void;
  /** Defaults to "decimal-pad" so the keyboard actually offers a period. */
  keyboardType?: TextInputProps["keyboardType"];
}

/**
 * TextInput for numbers that survives partially-typed decimals.
 *
 * The draft string is the source of truth while the user is editing — "2." stays
 * "2." on screen even though it parses to 2 — and the `value` prop only pushes
 * text back down when it changes underneath us (a duplicated set, a sync, a unit
 * conversion). On blur the draft collapses to its canonical form.
 */
const NumericInput = forwardRef<TextInput, NumericInputProps>(function NumericInput(
  { value, onChangeValue, onBlur, keyboardType = "decimal-pad", ...rest },
  ref,
) {
  const [text, setText] = useState(() => formatNumericValue(value));
  // The last value this input handed upward. Comparing against it (rather than
  // against the rendered text) is what distinguishes "the parent echoed our own
  // edit back" from "the value genuinely changed elsewhere".
  const committed = useRef<number | undefined>(value ?? undefined);

  useEffect(() => {
    const next = value ?? undefined;
    if (next === committed.current) return;
    committed.current = next;
    setText(formatNumericValue(next));
  }, [value]);

  const handleChangeText = useCallback(
    (raw: string) => {
      const sanitized = sanitizeNumericText(raw);
      setText(sanitized);
      const parsed = parseNumericText(sanitized);
      if (parsed === committed.current) return;
      committed.current = parsed;
      onChangeValue(parsed);
    },
    [onChangeValue],
  );

  const handleBlur = useCallback<NonNullable<TextInputProps["onBlur"]>>(
    (event) => {
      // Collapse leftover partial input ("2.", "007", ".") once editing ends.
      setText(formatNumericValue(committed.current));
      onBlur?.(event);
    },
    [onBlur],
  );

  return (
    <TextInput
      ref={ref}
      {...rest}
      keyboardType={keyboardType}
      value={text}
      onChangeText={handleChangeText}
      onBlur={handleBlur}
    />
  );
});

export default NumericInput;
