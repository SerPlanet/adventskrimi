import { z } from 'zod';
import { CardText, Day, Id, listFile } from './common';

export const RoomObject = z.object({
  id: Id,
  name: z.string().min(1),
  text: CardText,
  auffaellig: z.boolean().default(false),
});

export const Room = z.object({
  id: Id,
  name: z.string().min(1),
  description: CardText,
  neighbors: z.array(Id),
  objects: z.array(RoomObject).default([]),
});

export const Npc = z.object({
  id: Id,
  name: z.string().min(1),
  role: z.string().min(1),
  quirk: z.string().optional(),
  topics: z.array(z.object({ id: Id, label: z.string().min(1) })).default([]),
  /** day -> room id (deterministic daily plan) */
  schedule: z.record(z.coerce.number().pipe(Day), Id),
});

export const RoomsFile = listFile('rooms', Room);
export const NpcsFile = listFile('npcs', Npc);

export type Room = z.infer<typeof Room>;
export type Npc = z.infer<typeof Npc>;
