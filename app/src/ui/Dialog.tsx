import { useState } from 'react';
import { useSession, type Action } from '../store';
import { Popup } from './Popup';
import { Person } from './RoomScene';
import { FileFind } from './file/FileButton';

interface Exchange {
  key: number;
  lines: { speaker: string; text: string }[];
  finds: string[];
}

/**
 * Conversation like in a video game (02c §6): tapping a person opens it at once. The figure is
 * in view, the questions are a list, every question has an answer, showing an item asks more.
 * Free of charge. Every answer can be put into the dossier on its own.
 */
export function Dialog(props: { npcId: string; play: boolean; onClose: () => void }) {
  const { view, act, busy } = useSession();
  const [log, setLog] = useState<Exchange[]>([]);
  const npc = view?.room?.npcs.find((n) => n.id === props.npcId);
  if (!view || !npc) return null;

  const ask = async (a: Action) => {
    const r = await act(a);
    const answer = r?.result.answer;
    if (answer) setLog((l) => [...l, { key: l.length, lines: answer.lines, finds: answer.finds }]);
  };

  return (
    <Popup title={`Gespräch mit ${npc.name}`} onClose={props.onClose}>
      <div className="dialog">
        <div className="figure">
          <Person name={npc.name} />
          <p className="small">{npc.role}</p>
        </div>
        <div className="convo">
          <div role="log" aria-label="Gespräch" aria-live="polite">
            {log.length === 0 && <p className="small">{npc.name} schaut dich freundlich an.</p>}
            {log.map((x) => (
              <div key={x.key} className="exchange">
                <div className="bubbles">
                  {x.lines.map((l, i) => (
                    <p key={i} className={`bubble ${l.speaker === 'Du' ? 'r' : 'l'}`}>
                      <strong>{l.speaker}:</strong> {l.text}
                    </p>
                  ))}
                </div>
                {x.finds.map((id) => {
                  const f = view.finds.find((y) => y.id === id);
                  return f ? (
                    <div key={id}>
                      <p className="small">
                        {f.type === 'statement' ? 'Aussage (kann falsch sein)' : 'Fakt (stimmt)'}
                      </p>
                      <FileFind f={f} />
                    </div>
                  ) : null;
                })}
              </div>
            ))}
          </div>
          <h3>Was möchtest du fragen?</h3>
          <div className="row wrap">
            {npc.topics.map((t) => (
              <button
                key={t.id}
                className="chip"
                disabled={!props.play || busy}
                onClick={() => void ask({ type: 'talk', npc: npc.id, topic: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
          {view.inventory.length > 0 && (
            <>
              <h3>Etwas zeigen</h3>
              <div className="row wrap">
                {view.inventory.map((i) => (
                  <button
                    key={i.id}
                    className="chip"
                    disabled={!props.play || busy}
                    onClick={() => void ask({ type: 'use', item: i.id, target: npc.id })}
                  >
                    🎒 {i.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Popup>
  );
}
