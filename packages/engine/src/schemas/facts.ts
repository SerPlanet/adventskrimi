import { z } from 'zod';
import { CardText, Category, Day, Days, Id, listFile } from './common';

/** Solver-capable fact bodies (docs/04 §4). Shared by facts and statement claims. */
export const FactBody = z.discriminatedUnion('type', [
  /** a find of the story (motive, relation, arrival): no effect on the candidates, only evidence for an insight */
  z.object({ type: z.literal('story') }),
  z.object({ type: z.literal('presence'), person: Id, window: Id, room: Id }),
  z.object({ type: z.literal('absence'), person: Id, window: Id, room: Id }),
  z.object({ type: z.literal('exclusion'), category: Category, candidate: Id }),
  z.object({
    type: z.literal('link'),
    if: z.object({ category: Category, value: Id }),
    then: z.object({ category: Category, values: z.array(Id).min(1) }),
  }),
  z.object({
    type: z.literal('object_state'),
    object: Id,
    window: Id,
    state: z.string().min(1),
    effect: z.object({ category: Category, excludes: z.array(Id) }).optional(),
  }),
]);

/** Optional content tags used by validator minimums (docs/04 §7). */
const Tags = {
  red_herring: z.boolean().default(false),
  reinterpreted_on: Day.optional(),
  /** a relation between figures that the case tells as a story, never names (02c §3) */
  relation: z.string().optional(),
  /** insights this find is a proof (Beleg) of (WP20); the validator needs at least two per insight */
  supports: z.array(Id).default([]),
};

export const Fact = z.intersection(z.object({ id: Id, text: CardText, ...Tags }), FactBody);

export const Statement = z.object({
  id: Id,
  npc: Id,
  text: CardText,
  claims: z.array(FactBody).min(1),
  truth: z.boolean(),
  ...Tags,
});

export const SOURCE_KINDS = ['talk', 'inspect', 'use', 'newspaper', 'hotelbook'] as const;

export const Source = z.object({
  id: Id,
  kind: z.enum(SOURCE_KINDS),
  room: Id.optional(),
  npc: Id.optional(),
  object: Id.optional(),
  topic: Id.optional(),
  days: Days,
  requires: Id.optional(),
  /** days 1-5 only: the corridors that find this; absent = all. From day 6 everybody can use it. */
  route: z.array(Id).min(1).optional(),
  /**
   * The thing or question does not exist for the player until this holds (WP20): from a day,
   * after other sources were found (`asked`: source ids) or after finds were made (`has`).
   */
  unlock: z
    .object({
      day_from: Day.optional(),
      asked: z.array(Id).default([]),
      has: z.array(Id).default([]),
    })
    .optional(),
  /**
   * A question of the story can be asked again and again and gives the same answer. A question
   * of the course of the day (WP22c) is asked once (`once`) or only until a day (`until_day`):
   * after that it is no longer offered.
   */
  once: z.boolean().optional(),
  until_day: Day.optional(),
  /** fact or statement ids */
  yields: z.array(Id).min(1),
  /** neutral first-discoverer title, must not reveal place or content */
  plaque: z.string().optional(),
  /** how the UI shows the find (WP06b); the whole popup text is at most 60 words */
  /** document found here (02b §3): readable again in full from the inventory */
  document: z
    .object({ title: z.string().min(1), kind: z.enum(['zettel', 'brief', 'foto', 'quittung']) })
    .optional(),
  /** talk: the find that must be shown to get these answers (also expressible via requires) */
  shows: Id.optional(),
  /** talk: points the player to this figure as a witness */
  witness_of: Id.optional(),
  /**
   * A lock in front of this source (02c §5): what the attempt says, where the way to it can be
   * found (a room and thing, or deliberately nowhere) and how much waits behind it.
   */
  lock: z
    .object({
      versuchstext: CardText,
      hinweis_quelle: z.union([
        z.literal('ohne_hinweis'),
        z.object({ room: Id, ding: Id.optional() }),
      ]),
      belohnung: z.enum(['wichtig', 'bedeutend']),
    })
    .optional(),
  presentation: z.enum(['dialog', 'note', 'object', 'ambient']).optional(),
  lines: z.array(z.object({ speaker: z.string().min(1), text: z.string().min(1) })).optional(),
  note: z
    .object({ from: z.string().min(1), to: z.string().min(1), text: z.string().min(1) })
    .optional(),
});

export const FactsFile = listFile('facts', Fact);
export const StatementsFile = listFile('statements', Statement);
export const SourcesFile = listFile('sources', Source);

export type FactBody = z.infer<typeof FactBody>;
export type Fact = z.infer<typeof Fact>;
export type Statement = z.infer<typeof Statement>;
export type Source = z.infer<typeof Source>;
