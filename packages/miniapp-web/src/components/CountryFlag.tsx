type Props = { country: string; className?: string };

export function CountryFlag({ country, className = '' }: Props) {
  if (country.length !== 2) return null;
  const code = country.toUpperCase();
  // Regional indicator symbols: A = U+1F1E6, offset from 'A' = 0x41
  const flag = Array.from(code)
    .map((c) => String.fromCodePoint(0x1f1e6 + (c.charCodeAt(0) - 0x41)))
    .join('');
  return (
    <span aria-label={code} className={className}>
      {flag}
    </span>
  );
}
