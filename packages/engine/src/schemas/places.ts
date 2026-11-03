import { z } from 'zod';
import { CardText, Day, Id, listFile } from './common';

export const RoomObject = z.object({
  id: Id,
  name: z.string().min(1),
  text: CardText,
  /** deko: not clickable, ansehen: look only, untersuchbar: can be examined for 1 action. Derived when absent. */
  klasse: z.enum(['deko', 'ansehen', 'untersuchbar']).optional(),
  /** vector prop and its states, e.g. ["zu", "auf"] (WP06d) */
  prop: z.string().optional(),
  states: z.array(z.string()).optional(),
  /** hotspot position in the room scene, percent of width/height */
  spot: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
  /** size factor and depth layer in the scene (WP06f); defaults follow the spot */
  scale: z.number().min(0.3).max(3).optional(),
  layer: z.enum(['back', 'front']).optional(),
});

const Rect = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});

export const Room = z.object({
  id: Id,
  name: z.string().min(1),
  description: CardText,
  neighbors: z.array(Id),
  objects: z.array(RoomObject).default([]),
  /** rectangle in the floor plan, grid units (WP06f) */
  plan: Rect,
  /** connecting room (hall): drawn as a corridor */
  corridor: z.boolean().optional(),
  scene: z.string().optional(),
});

export const Npc = z.object({
  id: Id,
  name: z.string().min(1),
  role: z.string().min(1),
  quirk: z.string().optional(),
  topics: z.array(z.object({ id: Id, label: z.string().min(1) })).default([]),
  /** why this figure keeps something back (02b §5) */
  secret: z.string().optional(),
  lies: z
    .array(
      z.object({
        statement: Id,
        reason: z.string().min(1),
        refuted_by: z.array(Id).default([]),
        confirmed_by: z.array(Id).default([]),
      }),
    )
    .optional(),
  /** day -> room id (deterministic daily plan) */
  schedule: z.record(z.coerce.number().pipe(Day), Id),
});

/** Door in the floor plan; `at` lies on the shared wall. Must match an edge of the room graph. */
export const Door = z.object({ a: Id, b: Id, at: z.object({ x: z.number(), y: z.number() }) });
export const Outside = Rect.extend({
  kind: z.enum(['entrance', 'terrace', 'tree', 'snow', 'path']),
  label: z.string().optional(),
});
/** Rooms drawn as a staircase at the rim of the plan (still normal rooms in the graph). */
export const Stairs = z.object({ room: Id, dir: z.enum(['up', 'down']) });

export const RoomsFile = listFile('rooms', Room).extend({
  doors: z.array(Door),
  outside: z.array(Outside).default([]),
  stairs: z.array(Stairs).default([]),
});
export const NpcsFile = listFile('npcs', Npc);

export type Room = z.infer<typeof Room>;
export type Npc = z.infer<typeof Npc>;
