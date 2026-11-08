/**
 * Écran d'ouverture : la course du soleil tracée au compas.
 * Vingt-quatre rayons, deux cercles et l'arc de l'horizon se dessinent
 * pendant le chargement des images (la progression du tracé suit le
 * chargement réel), puis s'effacent quand l'aube révèle le paysage.
 * Position : centrée sur le soleil, par MosaicIntro.
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
        {/* frise de grecques autour du soleil : se trace avec le chargement réel */}
        <g opacity="0.7">
          <path d="M 500.0 428.0 L 500.0 408.0 L 518.7 409.9 L 515.7 424.0 L 507.3 422.7 L 508.0 415.6 L 512.4 416.1 M 500.0 428.0 L 518.6 430.5" pathLength={1} data-ray />
          <path d="M 518.6 430.5 L 523.8 411.1 L 541.3 417.8 L 534.9 430.7 L 527.0 427.3 L 529.6 420.5 L 533.7 422.2 M 518.6 430.5 L 536.0 437.6" pathLength={1} data-ray />
          <path d="M 536.0 437.6 L 546.0 420.3 L 561.2 431.3 L 551.6 442.1 L 545.0 436.7 L 549.1 430.9 L 552.7 433.5 M 536.0 437.6 L 550.9 449.1" pathLength={1} data-ray />
          <path d="M 550.9 449.1 L 565.1 434.9 L 576.9 449.5 L 564.9 457.4 L 559.8 450.5 L 565.3 445.9 L 568.1 449.4 M 550.9 449.1 L 562.4 464.0" pathLength={1} data-ray />
          <path d="M 562.4 464.0 L 579.7 454.0 L 587.3 471.1 L 573.7 475.6 L 570.6 467.7 L 577.1 464.7 L 578.8 468.8 M 562.4 464.0 L 569.5 481.4" pathLength={1} data-ray />
          <path d="M 569.5 481.4 L 588.9 476.2 L 591.8 494.7 L 577.5 495.5 L 576.5 487.1 L 583.6 485.9 L 584.2 490.3 M 569.5 481.4 L 572.0 500.0" pathLength={1} data-ray />
          <path d="M 572.0 500.0 L 592.0 500.0 L 590.1 518.7 L 576.0 515.7 L 577.3 507.3 L 584.4 508.0 L 583.9 512.4 M 572.0 500.0 L 569.5 518.6" pathLength={1} data-ray />
          <path d="M 569.5 518.6 L 588.9 523.8 L 582.2 541.3 L 569.3 534.9 L 572.7 527.0 L 579.5 529.6 L 577.8 533.7 M 569.5 518.6 L 562.4 536.0" pathLength={1} data-ray />
          <path d="M 562.4 536.0 L 579.7 546.0 L 568.7 561.2 L 557.9 551.6 L 563.3 545.0 L 569.1 549.1 L 566.5 552.7 M 562.4 536.0 L 550.9 550.9" pathLength={1} data-ray />
          <path d="M 550.9 550.9 L 565.1 565.1 L 550.5 576.9 L 542.6 564.9 L 549.5 559.8 L 554.1 565.3 L 550.6 568.1 M 550.9 550.9 L 536.0 562.4" pathLength={1} data-ray />
          <path d="M 536.0 562.4 L 546.0 579.7 L 528.9 587.3 L 524.4 573.7 L 532.3 570.6 L 535.3 577.1 L 531.2 578.8 M 536.0 562.4 L 518.6 569.5" pathLength={1} data-ray />
          <path d="M 518.6 569.5 L 523.8 588.9 L 505.3 591.8 L 504.5 577.5 L 512.9 576.5 L 514.1 583.6 L 509.7 584.2 M 518.6 569.5 L 500.0 572.0" pathLength={1} data-ray />
          <path d="M 500.0 572.0 L 500.0 592.0 L 481.3 590.1 L 484.3 576.0 L 492.7 577.3 L 492.0 584.4 L 487.6 583.9 M 500.0 572.0 L 481.4 569.5" pathLength={1} data-ray />
          <path d="M 481.4 569.5 L 476.2 588.9 L 458.7 582.2 L 465.1 569.3 L 473.0 572.7 L 470.4 579.5 L 466.3 577.8 M 481.4 569.5 L 464.0 562.4" pathLength={1} data-ray />
          <path d="M 464.0 562.4 L 454.0 579.7 L 438.8 568.7 L 448.4 557.9 L 455.0 563.3 L 450.9 569.1 L 447.3 566.5 M 464.0 562.4 L 449.1 550.9" pathLength={1} data-ray />
          <path d="M 449.1 550.9 L 434.9 565.1 L 423.1 550.5 L 435.1 542.6 L 440.2 549.5 L 434.7 554.1 L 431.9 550.6 M 449.1 550.9 L 437.6 536.0" pathLength={1} data-ray />
          <path d="M 437.6 536.0 L 420.3 546.0 L 412.7 528.9 L 426.3 524.4 L 429.4 532.3 L 422.9 535.3 L 421.2 531.2 M 437.6 536.0 L 430.5 518.6" pathLength={1} data-ray />
          <path d="M 430.5 518.6 L 411.1 523.8 L 408.2 505.3 L 422.5 504.5 L 423.5 512.9 L 416.4 514.1 L 415.8 509.7 M 430.5 518.6 L 428.0 500.0" pathLength={1} data-ray />
          <path d="M 428.0 500.0 L 408.0 500.0 L 409.9 481.3 L 424.0 484.3 L 422.7 492.7 L 415.6 492.0 L 416.1 487.6 M 428.0 500.0 L 430.5 481.4" pathLength={1} data-ray />
          <path d="M 430.5 481.4 L 411.1 476.2 L 417.8 458.7 L 430.7 465.1 L 427.3 473.0 L 420.5 470.4 L 422.2 466.3 M 430.5 481.4 L 437.6 464.0" pathLength={1} data-ray />
          <path d="M 437.6 464.0 L 420.3 454.0 L 431.3 438.8 L 442.1 448.4 L 436.7 455.0 L 430.9 450.9 L 433.5 447.3 M 437.6 464.0 L 449.1 449.1" pathLength={1} data-ray />
          <path d="M 449.1 449.1 L 434.9 434.9 L 449.5 423.1 L 457.4 435.1 L 450.5 440.2 L 445.9 434.7 L 449.4 431.9 M 449.1 449.1 L 464.0 437.6" pathLength={1} data-ray />
          <path d="M 464.0 437.6 L 454.0 420.3 L 471.1 412.7 L 475.6 426.3 L 467.7 429.4 L 464.7 422.9 L 468.8 421.2 M 464.0 437.6 L 481.4 430.5" pathLength={1} data-ray />
          <path d="M 481.4 430.5 L 476.2 411.1 L 494.7 408.2 L 495.5 422.5 L 487.1 423.5 L 485.9 416.4 L 490.3 415.8 M 481.4 430.5 L 500.0 428.0" pathLength={1} data-ray />
        </g>
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
