/**
 * « Le canon » — tracés de construction au nombre d'or, signature
 * graphique d'Apollon : la proportion antique qui devient grille de design.
 * Les traits se dessinent au défilement (data-draw → stroke-dashoffset).
 */
const PHI = 1.618;

export function CanonLines({ className = "" }: { className?: string }) {
  // rectangle d'or 1618 × 1000, subdivisé quatre fois, spirale en quarts de cercle
  const W = 1618;
  const H = 1000;
  const a = H; // premier carré
  const b = W - a; // 618
  const c = H - b; // 382
  const d = b - c; // 236
  return (
    <svg className={`canon ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <rect data-draw x="0.5" y="0.5" width={W - 1} height={H - 1} />
        <line data-draw x1={a} y1="0" x2={a} y2={H} />
        <line data-draw x1={a} y1={b} x2={W} y2={b} />
        <line data-draw x1={a + d} y1={b} x2={a + d} y2={H} />
        <line data-draw x1={a} y1={b + d / PHI} x2={a + d} y2={b + d / PHI} />
        <line data-draw x1="0" y1="0" x2={W} y2={H} opacity="0.5" />
        <line data-draw x1={W} y1="0" x2={a} y2={H} opacity="0.5" />
        <path
          data-draw
          d={`M0 ${H} A ${a} ${a} 0 0 1 ${a} 0 A ${b} ${b} 0 0 1 ${W} ${b} A ${c} ${c} 0 0 1 ${a + d} ${H} A ${d} ${d} 0 0 1 ${a} ${b + d / PHI}`}
        />
        <circle data-draw cx={a} cy={b} r="6" />
      </g>
    </svg>
  );
}
