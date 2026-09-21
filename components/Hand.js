'use client';
import { useEffect, useState } from 'react';

// A hand of five nails. Each nail: "MARK|polish" exactly as stored in the library.
const POLISH = { '': 'var(--nail-bare)', pink: 'var(--nail-hot)', lilac: 'var(--nail-lilac)', mint: 'var(--nail-mint)', sun: 'var(--nail-sun)', sky: 'var(--nail-sky)', ink: 'var(--nail-ink)' };

export function Nail({ spec, small }) {
  const [mark, polish = ''] = spec.split('|');
  const isEmoji = /\p{Extended_Pictographic}/u.test(mark);
  const len = [...mark].length;
  const fs = isEmoji ? (small ? '1.2rem' : '1.7rem') : len <= 2 ? (small ? '1rem' : '1.5rem') : len <= 3 ? (small ? '0.72rem' : '1rem') : len <= 4 ? (small ? '0.58rem' : '0.82rem') : len <= 5 ? (small ? '0.48rem' : '0.68rem') : (small ? '0.42rem' : '0.58rem');
  return <div className={'nail' + (polish === 'ink' ? ' on-ink' : '')} style={{ '--polish': POLISH[polish] || POLISH[''], '--fs': fs }}><b>{mark}</b></div>;
}

export function Hand({ set, small }) {
  return <div className="hand" aria-label={set.a}>{set.n.map((s, i) => <Nail key={i} spec={s} small={small} />)}</div>;
}

export default function HeroHand({ sets }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => setI(x => (x + 1) % sets.length), 3200);
    return () => clearInterval(t);
  }, [sets.length]);
  const set = sets[i];
  return (
    <div className="hand-card">
      <div key={i} className="fade">
        <Hand set={set} />
        <div className="hand-meta"><span className="ans">“{set.a}”</span><span className="code mono">{set.c}</span></div>
      </div>
      <div className="hand-nav" role="tablist" aria-label="Sample sets">
        {sets.map((s, k) => <button key={k} type="button" aria-current={k === i} aria-label={s.a} onClick={() => setI(k)} />)}
      </div>
    </div>
  );
}
