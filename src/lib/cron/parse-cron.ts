/**
 * cron-parser compatibility wrapper.
 *
 * `cron-parser` v4 exposes `parse()` and v5 exposes
 * `CronExpressionParser.parse()`; the worker previously carried this lookup
 * inline. Keep exactly one copy so a dependency bump cannot leave two
 * different parsers deciding when a job runs.
 */

import * as cronParser from 'cron-parser';

export interface CronInterval {
  next(): { toDate(): Date };
  prev(): { toDate(): Date };
}

export function parseCronExpression(
  expression: string,
  timezone = 'Asia/Dhaka',
  currentDate?: Date,
): CronInterval {
  const candidate: any = cronParser as any;
  const options: Record<string, unknown> = { tz: timezone };
  if (currentDate) options.currentDate = currentDate;

  const parse =
    candidate.parse ||
    candidate.parseExpression ||
    candidate.CronExpressionParser?.parse ||
    candidate.default?.parse ||
    candidate.default?.CronExpressionParser?.parse;

  if (typeof parse !== 'function') {
    throw new Error('cron-parser: no parse function available in the installed version');
  }
  return parse.call(candidate, expression, options) as CronInterval;
}

/** True when the expression is valid. Never throws. */
export function isValidCronExpression(expression: string, timezone = 'Asia/Dhaka'): boolean {
  try {
    parseCronExpression(expression, timezone);
    return true;
  } catch {
    return false;
  }
}

/** The next fire time, or null when the expression cannot be parsed. */
export function nextCronRun(expression: string, timezone = 'Asia/Dhaka', from?: Date): Date | null {
  try {
    return parseCronExpression(expression, timezone, from).next().toDate();
  } catch {
    return null;
  }
}
