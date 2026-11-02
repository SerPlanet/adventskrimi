export interface CheckResult {
  name: string;
  ok: boolean;
  errors: string[];
  /** optional short info shown after the check name */
  note?: string;
}

export const CHECK_NAMES = [
  'truth',
  'unique',
  'reach',
  'redundancy',
  'riddle',
  'refute',
  'minimums',
  'texts',
  'tempo',
] as const;
export type CheckName = (typeof CHECK_NAMES)[number];
