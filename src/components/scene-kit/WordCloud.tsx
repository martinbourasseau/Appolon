/**
 * Nuage de mots en profondeur (2,5D typographique) : chaque mot flotte sur
 * son propre plan, glisse à sa vitesse au défilement (data-depth) et dérive
 * doucement. Positions déterministes (même rendu serveur et navigateur).
 */
/** pseudo-aléatoire déterministe, indexé */
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return x - Math.floor(x);
};

export function WordCloud({ words, craft = [], label }: { words: string[]; craft?: string[]; label: string }) {
  let k = 0;
  const rnd = () => rand(++k);
  const cols = 4;
  const all = words.map((w) => ({ w, craft: false })).concat(craft.map((w) => ({ w, craft: true })));
  // mélange déterministe : outils et gestes du métier s'entrecroisent
  all.sort((a, b) => rand(a.w.length * 7 + a.w.charCodeAt(0)) - rand(b.w.length * 7 + b.w.charCodeAt(0)));
  const items = all.map(({ w, craft: isCraft }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const depth = [0.05, 0.12, 0.22, 0.32][Math.floor(rnd() * 4)];
    return {
      w,
      left: 4 + col * (80 / cols) + rnd() * 6,
      top: 8 + row * 24 + rnd() * 10,
      size: 1 + depth * 6.4,
      isCraft,
      depth,
      drift: rnd() > 0.5 ? "anim-drift" : "anim-drift-rev",
      faint: depth < 0.1,
    };
  });
  const rows = Math.ceil(all.length / cols);
  return (
    <div className="wordcloud" style={{ height: `${Math.max(38, rows * 15 + 12)}svh` }} aria-label={label} role="list">
      {items.map((it) => (
        <span
          key={it.w}
          role="listitem"
          className={`wordcloud__w ${it.drift}${it.faint ? " is-faint" : ""}${it.isCraft ? " is-craft" : ""}`}
          data-depth={it.depth}
          style={{ left: `${it.left}%`, top: `${it.top}%`, ["--fs" as string]: `${it.size}rem` }}
        >
          <i aria-hidden="true">/</i>
          {it.w}
        </span>
      ))}
    </div>
  );
}
