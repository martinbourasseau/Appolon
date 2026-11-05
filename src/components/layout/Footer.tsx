import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer__sig">{site.signature}</p>
      {site.location ? <p>{site.location}</p> : null}
      <p>
        <a href={site.parent.href}>{site.parent.name}</a> · <Link href="/mentions-legales">Mentions légales</Link>
      </p>
    </footer>
  );
}

/** Bandeau discret rappelant que la structure est provisoire */
export function BandeauProvisoire() {
  return (
    <p className="bandeau-provisoire" role="note">
      Structure provisoire · ressources et textes à valider
    </p>
  );
}
