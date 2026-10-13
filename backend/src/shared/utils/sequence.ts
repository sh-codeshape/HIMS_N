export interface SequenceFormattingOptions {
  includeYear?: boolean;
  padding?: number;
  suffix?: string;
}

export const buildSequenceNumber = (
  prefix: string,
  value: number,
  options: SequenceFormattingOptions = {}
): string => {
  const includeYear = options.includeYear ?? false;
  const padding = Math.max(1, Number.isFinite(options.padding) ? Number(options.padding) : 4);
  const suffix = options.suffix ?? '';
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
  const serial = String(normalizedValue).padStart(padding, '0');
  const yearToken = includeYear ? `${new Date().getFullYear() % 100}-` : '';

  return `${prefix}${yearToken}${serial}${suffix}`;
};
