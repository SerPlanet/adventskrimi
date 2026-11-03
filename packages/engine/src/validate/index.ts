import type { LoadedCase } from '../loader';
import type { Profile, Quality } from '../schemas';
import { applyProfile } from '../solver/profile';
import { buildInfo } from '../solver/info';
import {
  checkMinimums,
  checkReach,
  checkRedundancy,
  checkRefute,
  checkRiddle,
  checkUnique,
} from './content';
import { checkExplore } from './explore';
import { checkPlan } from './plan';
import { checkTempo, checkTexts } from './texts';
import { checkTruth } from './truth';
import { CHECK_NAMES, type CheckName, type CheckResult } from './types';

export * from './types';

/**
 * Checks 2-10 of docs/07 §2 for one profile. Check 1 (schema) happens in loadCase.
 * The profile subset is applied first, so each profile is validated on its own.
 */
export function runChecks(
  full: LoadedCase,
  profile: Profile,
  quality: Quality,
  only?: CheckName,
): CheckResult[] {
  const c = applyProfile(full, profile);
  const info = buildInfo(c, profile);
  const all: Record<CheckName, () => CheckResult> = {
    truth: () => checkTruth(c),
    unique: () => checkUnique(info),
    reach: () => checkReach(info),
    redundancy: () => checkRedundancy(info, quality),
    riddle: () => checkRiddle(info),
    refute: () => checkRefute(info),
    minimums: () => checkMinimums(info, quality),
    texts: () => checkTexts(info, quality),
    tempo: () => checkTempo(info, quality),
    explore: () => checkExplore(info, quality),
    plan: () => checkPlan(c),
  };
  return CHECK_NAMES.filter((n) => !only || n === only).map((n) => all[n]());
}
