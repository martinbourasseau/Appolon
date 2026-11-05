import { site } from "@/content/site";

/** Barre d'en-tête fine, posée sur les scènes */
export function Header() {
  return (
    <header className="header">
      <a className="header__mark" href="#apparition" aria-label="Apollon, retour au début">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="12"
              y1="2"
              x2="12"
              y2="5.2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              transform={`rotate(${i * 30} 12 12)`}
            />
          ))}
        </svg>
        <span>Apollon</span>
        <span className="header__sub">Création de sites web</span>
      </a>
      <nav className="header__nav" aria-label="Liens principaux">
        <a href={site.parent.href} className="header__link">
          {site.parent.name}
        </a>
        <a href="#contact" className="header__cta">
          Parler d&apos;un projet
        </a>
      </nav>
    </header>
  );
}
