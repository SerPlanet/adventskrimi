export type Level = 'easy' | 'medium' | 'hard';
export const LEVELS: Level[] = ['easy', 'medium', 'hard'];
export type Kind = 'sudoku' | 'word' | 'number' | 'logic';

/** Puzzle of the day. `answer` and `solutionText` stay on the server. */
export interface DailyPuzzle {
  kind: Kind;
  level: Level;
  day: number;
  title: string;
  prompt: string;
  /** what the client may see (grid, letters, clues) */
  data: Record<string, unknown>;
  /** canonical answer string */
  answer: string;
  /** tip 1 and tip 2; "show solution" is the third step */
  hints: [string, string];
  /** human readable solution shown at the end of the tip ladder */
  solutionText: string;
  /** alternative accepted answers (normalized), e.g. other words with the same letters */
  alternatives?: string[];
}
