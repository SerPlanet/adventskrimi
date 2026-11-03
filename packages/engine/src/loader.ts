// Node-only: reads YAML/JSON from disk. Not exported from index.ts so the browser bundle stays clean.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { z } from 'zod';
import * as S from './schemas';
import { checkRefs } from './refs';
import { NamesFile, type Names } from './names';

const CASE_FILES = {
  case: ['case.yaml', S.CaseFile],
  world: ['world.yaml', S.WorldFile],
  rooms: ['rooms.yaml', S.RoomsFile],
  npcs: ['npcs.yaml', S.NpcsFile],
  facts: ['facts.yaml', S.FactsFile],
  statements: ['statements.yaml', S.StatementsFile],
  sources: ['sources.yaml', S.SourcesFile],
  puzzles: ['puzzles.yaml', S.PuzzlesFile],
  events: ['events.yaml', S.EventsFile],
  newspaper: ['newspaper.yaml', S.NewspaperFile],
  questions: ['questions.yaml', S.QuestionsFile],
  prolog: ['prolog.yaml', S.PrologFile],
} as const;

export type LoadedCase = {
  [K in keyof typeof CASE_FILES]: z.infer<(typeof CASE_FILES)[K][1]>;
};

export type LoadResult = { ok: true; data: LoadedCase } | { ok: false; errors: string[] };

function formatIssues(file: string, err: z.ZodError): string[] {
  return err.issues.map((i) => `${file}: ${i.path.join('.') || '(root)'}: ${i.message}`);
}

/** Reads and validates all case files, then checks cross-references. */
export function loadCase(dir: string): LoadResult {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};
  for (const [key, [file, schema]] of Object.entries(CASE_FILES)) {
    let raw: unknown;
    try {
      raw = parse(readFileSync(join(dir, file), 'utf8'));
    } catch (e) {
      errors.push(`${file}: cannot read/parse (${(e as Error).message.split('\n')[0]})`);
      continue;
    }
    const res = (schema as z.ZodType).safeParse(raw);
    if (res.success) data[key] = res.data;
    else errors.push(...formatIssues(file, res.error));
  }
  if (errors.length) return { ok: false, errors };
  const refErrors = checkRefs(data as LoadedCase);
  if (refErrors.length) return { ok: false, errors: refErrors };
  return { ok: true, data: data as LoadedCase };
}

function loadConfigFile<T>(path: string, schema: z.ZodType<T>): T {
  const text = readFileSync(path, 'utf8');
  const raw = path.endsWith('.json') ? JSON.parse(text) : parse(text);
  const res = schema.safeParse(raw);
  if (!res.success) throw new Error(formatIssues(path, res.error).join('\n'));
  return res.data;
}

export const loadProfile = (path: string) => loadConfigFile(path, S.Profile);
export const loadScoring = (path: string) => loadConfigFile(path, S.Scoring);
export const loadQuality = (path: string) => loadConfigFile(path, S.Quality);

/** Reads `names:` from an insider.yaml; missing file or empty template = no renames. */
export function loadNames(path: string): Names {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return {};
  }
  const res = NamesFile.safeParse(parse(text) ?? {});
  if (!res.success) throw new Error(formatIssues(path, res.error).join('\n'));
  return res.data.names;
}
