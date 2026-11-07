/**
 * Écran d'ouverture : la course du soleil tracée au compas.
 * Vingt-quatre rayons, deux cercles et l'arc de l'horizon se dessinent
 * pendant le chargement des images (la progression du tracé suit le
 * chargement réel), puis s'effacent quand l'aube révèle le paysage.
 * Position : centrée sur le soleil, par ApolloIntro.
 */
export function IntroRays() {
  const rays = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const long = i % 2 === 0;
    const r0 = 74;
    const r1 = long ? 480 : 300;
    return {
      x1: 500 + Math.cos(a) * r0,
      y1: 500 + Math.sin(a) * r0,
      x2: 500 + Math.cos(a) * r1,
      y2: 500 + Math.sin(a) * r1,
      long,
    };
  });
  return (
    <svg className="intro-rays" viewBox="0 0 1000 1000" aria-hidden="true" data-intro-rays>
      <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <circle cx="500" cy="500" r="58" pathLength={1} data-ray />
        <circle cx="500" cy="500" r="40" pathLength={1} data-ray opacity="0.6" />
        <path d="M 20 500 A 480 480 0 0 1 980 500" pathLength={1} data-ray opacity="0.45" />
        {/* tracé régulateur au compas, comme une épure : carré, section d'or, diagonales, spirale */}
        <g opacity="0.34">
          <rect x="309" y="309" width="382" height="382" pathLength={1} data-ray />
          <line x1="545" y1="309" x2="545" y2="691" pathLength={1} data-ray />
          <line x1="545" y1="545" x2="691" y2="545" pathLength={1} data-ray />
          <line x1="0" y1="0" x2="1000" y2="1000" pathLength={1} data-ray />
          <line x1="1000" y1="0" x2="0" y2="1000" pathLength={1} data-ray />
          <path d="M 309 691 A 236 236 0 0 1 545 455 A 146 146 0 0 1 691 545 A 90 90 0 0 1 601 635" pathLength={1} data-ray />
          <line x1="0" y1="309" x2="1000" y2="309" pathLength={1} data-ray />
          <line x1="0" y1="691" x2="1000" y2="691" pathLength={1} data-ray />
        </g>
        {rays.map((r, i) => (
          <line
            key={i}
            x1={r.x1.toFixed(1)}
            y1={r.y1.toFixed(1)}
            x2={r.x2.toFixed(1)}
            y2={r.y2.toFixed(1)}
            pathLength={1}
            data-ray
            opacity={r.long ? 0.9 : 0.45}
          />
        ))}
      </g>
    </svg>
  );
}
