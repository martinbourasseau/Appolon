import type { Metadata } from "next";
import { site } from "@/content/site";
import Link from "next/link";
import { Provisoire } from "@/components/scene-kit/Provisoire";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" } };

export default function MentionsLegales() {
  const { publisher, siret, address, host } = site.legal;
  const rows = [
    ["Éditeur", publisher],
    ["SIRET", siret],
    ["Adresse", address],
    ["Hébergeur", host],
  ] as const;
  return (
    <main id="contenu" className="legal">
      <Link href="/" className="legal__back">← Apollon</Link>
      <h1>Mentions légales</h1>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v ?? <Provisoire label={k} expected="Information à fournir avant publication." ratio="8 / 1" />}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
