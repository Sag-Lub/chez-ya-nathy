import { LastOrderRedirect } from "./LastOrderRedirect"

export const metadata = { title: "Suivi de commande" }

/** Onglet « Suivi » : ouvre la dernière commande passée depuis ce téléphone. */
export default function SuiviIndexPage() {
  return <LastOrderRedirect />
}
