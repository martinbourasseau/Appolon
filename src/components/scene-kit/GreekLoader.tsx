/**
 * Attente à l'antique : une frise de grecques (méandres) se trace en cercle
 * autour du soleil d'Apollon, pendant que quelques tesselles se posent.
 * Purement CSS (aucun minuteur) : l'élément n'est visible que tant que la
 * ressource attendue ne le recouvre pas — l'attente affichée est réelle.
 */
const N = 16;
const R0 = 30;
const R1 = 40;

function polar(u: number, v: number) {
  const a = (u / N) * Math.PI * 2 - Math.PI / 2;
  const r = R0 + v * (R1 - R0);
  return `${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
}

// un motif de grecque par segment, en coordonnées (le long du cercle, vers l'extérieur)
const KEY: [number, number][] = [
  [0, 0], [0, 1], [0.78, 1], [0.78, 0.28], [0.36, 0.28], [0.36, 0.64], [0.56, 0.64],
];
const MEANDERS = Array.from({ length: N }, (_, i) => "M " + KEY.map(([u, v]) => polar(i + u, v)).join(" L ") + ` M ${polar(i, 0)} L ${polar(i + 1, 0)}`);

export function GreekLoader({ label, tone = "or" }: { label?: string; tone?: "or" | "clair" }) {
  return (
    <span className={`greek-loader greek-loader--${tone}`} role={label ? "status" : undefined} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 100 100" width="64" height="64" aria-hidden="true">
        <circle className="greek-loader__ring" cx="50" cy="50" r={R1 + 3} pathLength={1} />
        {MEANDERS.map((d, i) => (
          <path key={i} className="greek-loader__key" d={d} pathLength={1} style={{ animationDelay: `${(i / N) * 1.2}s` }} />
        ))}
        <g className="greek-loader__sun">
          <circle cx="50" cy="50" r="7" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="50" y1="36" x2="50" y2="41" transform={`rotate(${i * 45} 50 50)`} />
          ))}
        </g>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} className="greek-loader__tess" x={44 + (i % 2) * 7} y={58 + Math.floor(i / 2) * 5} width="5.5" height="4" rx="0.8" style={{ animationDelay: `${0.25 + i * 0.18}s` }} />
        ))}
      </svg>
      {label ? <span className="greek-loader__label">{label}</span> : null}
    </span>
  );
}
