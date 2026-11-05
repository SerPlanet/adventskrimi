import type { LoadedCase } from '../loader';

const STORIES = { min: 2, max: 4 };
const JOKE_WORDS_MAX = 30;

/**
 * The fixed structure of every issue (WP24, D87): lead story, 2-4 more stories, a riddle and a joke.
 * Riddle and joke never carry a find. Days after `paper_required_through` only report "content follows".
 */
export function checkPaperStructure(c: LoadedCase): { errors: string[]; note: string } {
  const errors: string[] = [];
  const through = c.newspaper.paper_required_through;
  const names = c.npcs.npcs
    .flatMap((n) => [n.id, ...n.name.split(/\s+/)])
    .map((x) => x.toLowerCase());
  const used = new Set([
    ...c.sources.sources.flatMap((s) => s.yields),
    ...c.newspaper.articles.flatMap((a) => a.traegt),
  ]);
  const mix = (day: number) =>
    c.newspaper.articles
      .filter((a) => a.day === day)
      .map((a) => a.kind)
      .sort()
      .join('+');

  for (let day = 1; day <= through; day++) {
    const ev = c.events.events.find((e) => e.day === day);
    if (!ev?.headline || !ev.text)
      errors.push(`day ${day}: no lead story (event headline and text)`);
    const n = c.newspaper.articles.filter((a) => a.day === day).length;
    if (n < STORIES.min || n > STORIES.max)
      errors.push(`day ${day}: ${n} more stories (${STORIES.min}-${STORIES.max})`);
    if (day > 1 && mix(day) === mix(day - 1))
      errors.push(`day ${day}: same mix of story kinds as day ${day - 1} (${mix(day)})`);
    const jokes = c.newspaper.jokes.filter((j) => j.day === day);
    if (jokes.length !== 1) errors.push(`day ${day}: ${jokes.length} jokes (need 1)`);
    for (const j of jokes) {
      const sentences = j.text.split(/(?<=[.!?])\s+/).filter(Boolean).length;
      if (sentences > 2 || j.text.split(/\s+/).length > JOKE_WORDS_MAX)
        errors.push(`joke ${j.id}: longer than 2 sentences or ${JOKE_WORDS_MAX} words`);
      if (
        j.text.includes('{') ||
        names.some(
          (nm) =>
            nm.length > 2 &&
            new RegExp(String.raw`(^|[^\p{L}])${nm}([^\p{L}]|$)`, 'iu').test(j.text),
        )
      )
        errors.push(`joke ${j.id}: refers to a figure`);
      if (used.has(j.id)) errors.push(`joke ${j.id}: carries a find`);
    }
    if (j2kind(c, day) === j2kind(c, day - 1) && jokes.length && day > 1)
      errors.push(`day ${day}: same joke kind as day ${day - 1}`);
  }
  // the riddle of a day comes from the rotation; it never carries a find
  const rot = c.riddles.rotation;
  if (new Set(rot).size < 2) errors.push('riddles.yaml: rotation needs at least 2 kinds');
  const todo =
    through < 24 ? `content follows (D80) from day ${through + 1}` : 'all 24 days complete';
  return { errors, note: `structure through day ${through}, ${todo}` };
}

const j2kind = (c: LoadedCase, day: number) => c.newspaper.jokes.find((j) => j.day === day)?.kind;
