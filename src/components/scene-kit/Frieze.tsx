/**
 * Frise gravée (grecques) qui se trace au défilement en tête de chaque
 * chapitre — une ligne de marbre ciselé entre l'image et le texte.
 */
const UNIT = 24;
const COUNT = 40;
const key = (x: number) =>
  `M ${x} 18 L ${x} 2 L ${x + 18} 2 L ${x + 18} 14 L ${x + 7} 14 L ${x + 7} 8 L ${x + 12} 8 M ${x} 18 L ${x + UNIT} 18`;
const D = Array.from({ length: COUNT }, (_, i) => key(i * UNIT)).join(" ");

export function Frieze() {
  return (
    <div className="frieze" aria-hidden="true">
      <svg viewBox={`0 0 ${UNIT * COUNT} 20`} preserveAspectRatio="xMidYMid meet">
        <path d={D} pathLength={1} data-frieze />
      </svg>
    </div>
  );
}
