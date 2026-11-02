import { SHAPES } from './shapes';

/** Keywords of an object name -> prop. First match wins; an explicit `prop` of the case always wins. */
const KEYWORDS: [RegExp, string][] = [
  [/alarm/i, 'alarm'],
  [/schlüsselbrett|schluessel/i, 'schluessel'],
  [/tür|tuer/i, 'tuer'],
  [/zettel|aushang|brief/i, 'zettel'],
  [/tresor|safe/i, 'tresor'],
  [/baum/i, 'baum'],
  [/rezept/i, 'rezept'],
  [/runden|buch|wälzer|waelzer|album/i, 'buch'],
  [/festtafel|tisch/i, 'tisch'],
  [/pinnwand|tafel(?!n)|brett/i, 'pinnwand'],
  [/anrichte|kommode|sideboard/i, 'anrichte'],
  [/stollen|kuchen/i, 'stollen'],
  [/herd|ofen/i, 'herd'],
  [/heizkessel/i, 'kessel'],
  [/topf|kupfer/i, 'topf'],
  [/vitrine/i, 'vitrine'],
  [/uhr/i, 'standuhr'],
  [/klavier|deckel|flügel/i, 'klavier'],
  [/sessel|stuhl|sofa/i, 'sessel'],
  [/kamin/i, 'kamin'],
  [/wein/i, 'weinregal'],
  [/regal|schrank/i, 'regal'],
  [/leiter/i, 'leiter'],
  [/truhe|werkzeug|kiste/i, 'truhe'],
];

export function propFor(name: string, prop?: string): string {
  if (prop && SHAPES[prop]) return prop;
  const hit = KEYWORDS.find(([re]) => re.test(name));
  return hit?.[1] ?? 'kiste';
}

/** One prop in one of its two states. Decorative: the hotspot button carries the name. */
export function Prop(props: { name: string; prop?: string; open: boolean; className?: string }) {
  const shape = SHAPES[propFor(props.name, props.prop)] ?? SHAPES.kiste;
  return (
    <svg
      className={props.className}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      data-prop={propFor(props.name, props.prop)}
      data-state={props.open ? 'auf' : 'zu'}
    >
      {shape?.(props.open)}
    </svg>
  );
}
