import type { Folio } from "@/content/scenes";

/** Phrase d'introduction à lettrine, révélée ligne à ligne */
export function Lead({ text }: { text: string }) {
  const first = text.charAt(0);
  const rest = text.slice(1);
  return (
    <p className="lead" data-reveal="lines">
      <span className="lead__drop" aria-hidden="true">
        {first}
      </span>
      <span className="sr-only">{first}</span>
      {rest}
    </p>
  );
}

/** Folios : courts blocs numérotés titre + texte */
export function Folios({ items, numeral }: { items: Folio[]; numeral: string }) {
  return (
    <ol className="folios" data-reveal="stagger">
      {items.map((f, i) => (
        <li key={f.title} className="folio">
          <span className="folio__index">
            {numeral}.{i + 1}
          </span>
          <h3 className="folio__title">{f.title}</h3>
          <p className="folio__text">{f.text}</p>
        </li>
      ))}
    </ol>
  );
}
