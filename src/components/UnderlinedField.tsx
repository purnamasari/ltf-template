type UnderlinedFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email";
  label: string;
  autoFocus?: boolean;
};

/**
 * The single writing rule used by the name and delivery steps: a 730px line
 * with the value sitting on it.
 */
export function UnderlinedField({
  value,
  onChange,
  placeholder,
  type = "text",
  label,
  autoFocus = false,
}: UnderlinedFieldProps) {
  return (
    <div className="absolute left-[232px] top-[408px] w-[730px]">
      <label className="sr-only" htmlFor="underlined-field">
        {label}
      </label>
      <input
        id="underlined-field"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCapitalize={type === "email" ? "none" : "words"}
        spellCheck={false}
        className="h-[55px] w-full bg-transparent px-[13px] font-display text-[30px] font-light text-ink outline-none placeholder:text-[#9a9384]"
      />
      <div aria-hidden className="h-px w-full bg-gold" />
    </div>
  );
}
