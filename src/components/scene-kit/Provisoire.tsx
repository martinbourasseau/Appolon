/**
 * Emplacement provisoire, volontairement visible.
 * Affiché tant qu'une ressource définitive n'a pas été fournie.
 * Rechercher « Provisoire » dans le code pour les retrouver tous.
 */
type Props = {
  /** Ressource attendue, en clair */
  expected: string;
  /** Libellé court (ex. « Image d'ouverture ») */
  label?: string;
  className?: string;
  /** Rapport largeur/hauteur, ex. "16 / 10". Omis = remplit son parent. */
  ratio?: string;
  tone?: "clair" | "sombre";
};

export function Provisoire({ expected, label = "Ressource attendue", className = "", ratio, tone = "clair" }: Props) {
  return (
    <div
      className={`provisoire provisoire--${tone} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      role="img"
      aria-label={`Emplacement provisoire : ${expected}`}
    >
      <span className="provisoire__tag">Provisoire</span>
      <span className="provisoire__label">{label}</span>
      <span className="provisoire__text">{expected}</span>
    </div>
  );
}

/** Pastille « provisoire » posée sur une ressource temporaire déjà affichée */
export function ProvisoireTag({ note, className = "" }: { note: string; className?: string }) {
  return (
    <span className={`provisoire-tag ${className}`} title={note}>
      <b>Provisoire</b> {note}
    </span>
  );
}
