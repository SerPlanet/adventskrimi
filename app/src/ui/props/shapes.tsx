import type { ReactNode } from 'react';

/** Palette of the style guide (app/src/ui/style-guide.md). */
export const C = {
  wood: '#8a5a2b',
  dark: '#5e3b1b',
  paper: '#f6ecd0',
  metal: '#9aa3a8',
  red: '#b8433a',
  green: '#3f6b4f',
  gold: '#e0b24a',
  snow: '#eef4f8',
  line: '#3a2616',
};

const s = { stroke: C.line, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
export type Shape = (open: boolean) => ReactNode;

/** Props with two states each: closed/normal and open/lifted. Drawn from the front, base line y=94. */
export const SHAPES: Record<string, Shape> = {
  schrank: (o) => (
    <>
      <rect x="22" y="10" width="56" height="84" fill={C.wood} {...s} />
      {o ? (
        <>
          <rect x="26" y="14" width="48" height="76" fill={C.dark} {...s} />
          <rect x="30" y="52" width="40" height="8" fill={C.paper} {...s} />
          <path d="M26 14 L10 22 L10 84 L26 90Z" fill={C.wood} {...s} />
        </>
      ) : (
        <>
          <path d="M50 10V94" {...s} />
          <circle cx="45" cy="54" r="2.5" fill={C.gold} {...s} />
          <circle cx="55" cy="54" r="2.5" fill={C.gold} {...s} />
        </>
      )}
    </>
  ),
  pinnwand: (o) => (
    <>
      <rect x="12" y="18" width="76" height="58" fill={C.wood} {...s} />
      <rect x="17" y="23" width="66" height="48" fill="#c9a36a" {...s} />
      <rect x="24" y="30" width="18" height="14" fill={C.paper} {...s} />
      <rect x="50" y="34" width="22" height="16" fill={C.snow} {...s} />
      {o ? (
        <>
          <path
            d="M24 30 L42 28 L42 44 L24 44Z"
            fill={C.paper}
            {...s}
            transform="rotate(-8 33 37)"
          />
          <rect x="30" y="52" width="24" height="16" fill={C.paper} {...s} />
          <path d="M33 58H50M33 63H46" {...s} />
        </>
      ) : (
        <circle cx="33" cy="30" r="2.5" fill={C.red} {...s} />
      )}
      <path d="M30 76V94M70 76V94" {...s} />
    </>
  ),
  zettel: (o) => (
    <>
      <path d="M28 20 L72 16 L76 80 L32 86Z" fill={C.paper} {...s} />
      <path d="M38 36H64M38 48H66M38 60H58" {...s} />
      {o && <circle cx="66" cy="74" r="6" fill={C.red} {...s} />}
    </>
  ),
  truhe: (o) => (
    <>
      <rect x="14" y="48" width="72" height="46" fill={C.wood} {...s} />
      {o ? (
        <path d="M14 48 L24 20 H76 L86 48Z" fill={C.dark} {...s} />
      ) : (
        <path d="M14 48 Q50 24 86 48Z" fill={C.wood} {...s} />
      )}
      <rect x="44" y="52" width="12" height="14" fill={C.gold} {...s} />
      {o && <rect x="30" y="38" width="40" height="8" fill={C.gold} {...s} />}
    </>
  ),
  tuer: (o) => (
    <>
      <rect x="24" y="8" width="52" height="86" fill={C.dark} {...s} />
      {o ? (
        <path d="M24 8 L62 14 V90 L24 94Z" fill={C.wood} {...s} />
      ) : (
        <>
          <rect x="28" y="12" width="44" height="78" fill={C.wood} {...s} />
          <circle cx="64" cy="54" r="3" fill={C.gold} {...s} />
        </>
      )}
    </>
  ),
  regal: (o) => (
    <>
      <rect x="14" y="8" width="72" height="86" fill={C.wood} {...s} />
      <path d="M14 36H86M14 64H86" {...s} />
      <rect x="20" y="14" width="8" height="22" fill={C.red} {...s} />
      <rect x="30" y="16" width="8" height="20" fill={C.green} {...s} />
      <rect x="42" y="42" width="10" height="22" fill={C.gold} {...s} />
      <rect x="56" y="70" width="8" height="24" fill={C.red} {...s} />
      {o && (
        <rect
          x="66"
          y="44"
          width="14"
          height="20"
          fill={C.paper}
          {...s}
          transform="rotate(14 73 54)"
        />
      )}
    </>
  ),
  buch: (o) => (
    <>
      <path d="M14 70 L50 78 L86 70 V36 L50 44 L14 36Z" fill={o ? C.paper : C.red} {...s} />
      <path d="M50 44V78" {...s} />
      {o && <path d="M24 48L44 52M24 56L44 60M56 52L76 48M56 60L76 56" {...s} />}
    </>
  ),
  tresor: (o) => (
    <>
      <rect x="16" y="16" width="68" height="78" fill={C.metal} {...s} />
      {o ? (
        <>
          <path d="M16 16 L34 22 V88 L16 94Z" fill={C.dark} {...s} />
          <rect x="40" y="30" width="38" height="52" fill={C.dark} {...s} />
          <rect x="48" y="52" width="22" height="12" fill={C.paper} {...s} />
        </>
      ) : (
        <>
          <circle cx="50" cy="52" r="14" fill={C.dark} {...s} />
          <circle cx="50" cy="52" r="4" fill={C.gold} {...s} />
        </>
      )}
    </>
  ),
  standuhr: (o) => (
    <>
      <rect x="30" y="6" width="40" height="88" fill={C.wood} {...s} />
      <circle cx="50" cy="26" r="13" fill={C.paper} {...s} />
      <path d={o ? 'M50 26V15M50 26L58 30' : 'M50 26V16M50 26L44 30'} {...s} />
      <rect x="36" y="46" width="28" height="40" fill={o ? C.dark : '#7a4b22'} {...s} />
      {o && <path d="M50 50V70" stroke={C.gold} strokeWidth="4" />}
    </>
  ),
  klavier: (o) => (
    <>
      <rect x="10" y="44" width="80" height="50" fill={C.dark} {...s} />
      {o ? (
        <path d="M10 44 L18 14 H82 L90 44Z" fill={C.wood} {...s} />
      ) : (
        <rect x="10" y="38" width="80" height="8" fill={C.wood} {...s} />
      )}
      <rect x="14" y="56" width="72" height="14" fill={C.snow} {...s} />
      <path d="M26 56V70M38 56V70M50 56V70M62 56V70M74 56V70" {...s} />
      {o && <rect x="40" y="26" width="20" height="12" fill={C.paper} {...s} />}
    </>
  ),
  sessel: (o) => (
    <>
      <path d="M18 40 Q50 18 82 40 V76 H18Z" fill={C.red} {...s} />
      <rect x="10" y="52" width="14" height="32" fill={C.dark} {...s} />
      <rect x="76" y="52" width="14" height="32" fill={C.dark} {...s} />
      <rect x="24" y="60" width="52" height="16" fill="#9b3b33" {...s} />
      {o && <rect x="38" y="62" width="24" height="10" fill={C.paper} {...s} />}
    </>
  ),
  kamin: (o) => (
    <>
      <rect x="10" y="12" width="80" height="82" fill="#7d7167" {...s} />
      <path d="M26 94V50 Q50 34 74 50V94Z" fill={C.dark} {...s} />
      {o ? (
        <path d="M50 88 Q36 76 46 62 Q48 70 52 66 Q60 76 50 88Z" fill={C.gold} {...s} />
      ) : (
        <path d="M34 90H66" stroke={C.wood} strokeWidth="6" />
      )}
      <rect x="6" y="8" width="88" height="8" fill={C.wood} {...s} />
    </>
  ),
  herd: (o) => (
    <>
      <rect x="14" y="30" width="72" height="64" fill={C.metal} {...s} />
      <rect x="20" y="52" width="60" height="34" fill={C.dark} {...s} />
      {o && <path d="M32 78 Q50 56 68 78Z" fill={C.gold} {...s} />}
      <circle cx="32" cy="38" r="7" fill={C.dark} {...s} />
      <circle cx="68" cy="38" r="7" fill={C.dark} {...s} />
      <path d="M46 20V30M54 20V30" {...s} />
    </>
  ),
  topf: (o) => (
    <>
      <path d="M22 40 H78 V84 Q50 96 22 84Z" fill="#b87333" {...s} />
      <path d="M14 48H22M78 48H86" {...s} />
      {o ? (
        <ellipse cx="50" cy="38" rx="28" ry="7" fill={C.dark} {...s} />
      ) : (
        <path d="M22 40 Q50 20 78 40Z" fill="#b87333" {...s} />
      )}
    </>
  ),
  baum: (o) => (
    <>
      <path d="M50 8 L78 50 H22Z M50 30 L84 74 H16Z" fill={C.green} {...s} />
      <rect x="44" y="74" width="12" height="20" fill={C.dark} {...s} />
      <circle cx="42" cy="48" r="4" fill={C.red} {...s} />
      <circle cx="60" cy="64" r="4" fill={C.gold} {...s} />
      {o && <rect x="56" y="82" width="22" height="12" fill={C.red} {...s} />}
    </>
  ),
  vitrine: (o) => (
    <>
      <rect x="16" y="12" width="68" height="82" fill={C.wood} {...s} />
      <rect x="22" y="18" width="56" height="56" fill={o ? C.dark : '#cfe3f5'} {...s} />
      {o ? (
        <path d="M22 18 L10 26 V70 L22 74Z" fill="#cfe3f5" {...s} />
      ) : (
        <path d="M30 30L44 18M40 50L62 26" stroke={C.snow} strokeWidth="3" />
      )}
      <rect x="36" y="48" width="28" height="26" fill={C.gold} {...s} />
    </>
  ),
  schluessel: (o) => (
    <>
      <rect x="14" y="24" width="72" height="44" fill={C.wood} {...s} />
      <path d="M30 36V50M46 36V50M62 36V50" {...s} />
      <circle cx="30" cy="56" r="5" fill={C.gold} {...s} />
      <circle cx="46" cy="56" r="5" fill={C.gold} {...s} />
      {!o && <circle cx="62" cy="56" r="5" fill={C.gold} {...s} />}
    </>
  ),
  kessel: (o) => (
    <>
      <rect x="20" y="14" width="60" height="80" rx="14" fill={C.metal} {...s} />
      <circle cx="50" cy="40" r="10" fill={C.paper} {...s} />
      <path d={o ? 'M50 40L58 34' : 'M50 40L44 46'} {...s} />
      <rect x="38" y="62" width="24" height="22" fill={C.dark} {...s} />
      {o && <path d="M44 80 Q50 66 56 80Z" fill={C.gold} {...s} />}
    </>
  ),
  weinregal: (o) => (
    <>
      <rect x="12" y="12" width="76" height="82" fill={C.wood} {...s} />
      {[28, 52, 76].map((y) => (
        <g key={y}>
          <circle cx="30" cy={y} r="8" fill={C.dark} {...s} />
          <circle cx="50" cy={y} r="8" fill={C.dark} {...s} />
          <circle cx="70" cy={y} r="8" fill={o && y === 52 ? C.paper : C.dark} {...s} />
        </g>
      ))}
    </>
  ),
  alarm: (o) => (
    <>
      <rect x="28" y="14" width="44" height="60" fill={C.metal} {...s} />
      <circle cx="50" cy="34" r="8" fill={o ? C.green : C.red} {...s} />
      <rect x="36" y="50" width="28" height="16" fill={C.dark} {...s} />
      {o && <path d="M36 50 L26 56 V72 L36 66Z" fill={C.metal} {...s} />}
    </>
  ),
  leiter: (o) => (
    <>
      <path d={o ? 'M30 94 L40 8M60 94 L70 8' : 'M32 94 L40 12M62 94 L70 12'} {...s} />
      {[28, 46, 64, 82].map((y) => (
        <path key={y} d={`M${36 - (y - 28) / 20} ${y}H${66 - (y - 28) / 20}`} {...s} />
      ))}
    </>
  ),
  anrichte: (o) => (
    <>
      <rect x="10" y="40" width="80" height="54" fill={C.wood} {...s} />
      <rect x="6" y="34" width="88" height="8" fill={C.dark} {...s} />
      <path d="M50 42V94" {...s} />
      {o ? (
        <rect x="52" y="52" width="30" height="14" fill={C.paper} {...s} />
      ) : (
        <circle cx="46" cy="64" r="2.5" fill={C.gold} {...s} />
      )}
      <ellipse cx="32" cy="30" rx="12" ry="5" fill={C.snow} {...s} />
    </>
  ),
  stollen: (o) => (
    <>
      <rect x="10" y="62" width="80" height="8" fill={C.metal} {...s} />
      <path d="M16 62 Q50 20 84 62Z" fill="#d9a65a" {...s} />
      <path d="M26 56 Q50 40 74 56" stroke={C.snow} strokeWidth="5" fill="none" />
      {o && <path d="M42 58 L58 58 L50 46Z" fill={C.paper} {...s} />}
    </>
  ),
  rezept: (o) => (
    <>
      <rect x="22" y="18" width="56" height="70" fill={C.green} {...s} />
      <rect x="30" y="28" width="40" height="14" fill={C.paper} {...s} />
      {o && <rect x="34" y="50" width="32" height="30" fill={C.paper} {...s} />}
    </>
  ),
  tafel: (o) => (
    <>
      <rect x="8" y="46" width="84" height="10" fill={C.wood} {...s} />
      <path d="M16 56V94M84 56V94" {...s} />
      <circle cx="30" cy="40" r="7" fill={C.snow} {...s} />
      <circle cx="56" cy="40" r="7" fill={C.snow} {...s} />
      {o && <rect x="66" y="34" width="16" height="10" fill={C.paper} {...s} />}
    </>
  ),
  tisch: (o) => (
    <>
      <rect x="10" y="44" width="80" height="10" fill={C.wood} {...s} />
      <rect x="18" y="54" width="64" height="12" fill={C.dark} {...s} />
      <path d="M18 66V94M82 66V94" {...s} />
      {o ? (
        <rect x="36" y="58" width="28" height="12" fill={C.paper} {...s} />
      ) : (
        <rect x="34" y="32" width="32" height="12" fill={C.red} {...s} />
      )}
    </>
  ),
  kiste: (o) => (
    <>
      <rect x="18" y="40" width="64" height="52" fill={C.wood} {...s} />
      <path d="M18 56H82" {...s} />
      <rect x="44" y="50" width="12" height="12" fill={C.gold} {...s} />
      {o && <rect x="26" y="26" width="48" height="14" fill={C.paper} {...s} />}
    </>
  ),
};
