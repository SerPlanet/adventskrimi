import { z } from 'zod';
import { CardText, Category, Days, Id, listFile } from './common';

/** Solver-capable fact bodies (docs/04 §4). Shared by facts and statement claims. */
export const FactBody = z.discriminatedUnion('type', [
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

export const Fact = z.intersection(z.object({ id: Id, text: CardText }), FactBody);

export const Statement = z.object({
  id: Id,
  npc: Id,
  text: CardText,
  claims: z.array(FactBody).min(1),
  truth: z.boolean(),
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
  auffaellig: z.boolean().default(false),
  /** fact or statement ids */
  yields: z.array(Id).min(1),
  /** neutral first-discoverer title, must not reveal place or content */
  plaque: z.string().optional(),
});

export const FactsFile = listFile('facts', Fact);
export const StatementsFile = listFile('statements', Statement);
export const SourcesFile = listFile('sources', Source);

export type FactBody = z.infer<typeof FactBody>;
export type Fact = z.infer<typeof Fact>;
export type Statement = z.infer<typeof Statement>;
export type Source = z.infer<typeof Source>;
