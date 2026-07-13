import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

// Tant qu'aucun domaine n'est vérifié dans Resend, seul cet expéditeur
// sandbox fonctionne, et uniquement vers l'adresse du compte Resend.
export const EMAIL_FROM = "Chez ya Nathy <onboarding@resend.dev>";
