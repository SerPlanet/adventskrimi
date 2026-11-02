import { z } from 'zod';
import { CardText, Day, Id, listFile } from './common';

export const RoomObject = z.object({
  id: Id,
  name: z.string().min(1),
  text: CardText,
  auffaellig: z.boolean().default(false),
  /** vector prop and its states, e.g. ["zu", "auf"] (WP06d) */
  prop: z.string().optional(),
  states: z.array(z.string()).optional(),
  /** hotspot position in the room scene, percent of width/height */
  spot: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
});

export const Room = z.object({
  id: Id,
  name: z.string().min(1),
  description: CardText,
  neighbors: z.array(Id),
  objects: z.array(RoomObject).default([]),
  /** position in the hotel cross-section and scene id (WP06b, optional) */
  floor: z.number().int().optional(),
  col: z.number().int().optional(),
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

export const RoomsFile = listFile('rooms', Room);
export const NpcsFile = listFile('npcs', Npc);

export type Room = z.infer<typeof Room>;
export type Npc = z.infer<typeof Npc>;
