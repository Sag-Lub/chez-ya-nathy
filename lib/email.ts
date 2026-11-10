import { resend, EMAIL_FROM } from "@/lib/resend"
import { formatPrice } from "@/lib/utils"
import { spiceLabel } from "@/lib/labels"
import type { OrderItem, OrderType, PaymentMethod } from "@/lib/types"

interface ConfirmationEmailParams {
  email: string
  customerName: string
  publicToken: string
  type: OrderType
  paymentMethod: PaymentMethod
  address: string | null
  postalCode: string | null
  items: OrderItem[]
  subtotalCents: number
  deliveryFeeCents: number
  totalCents: number
}

/** Les noms et l'adresse viennent du client : on les échappe avant de les mettre dans le HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Détail d'une ligne : piquant, accompagnement, suppléments. */
function itemDetail(item: OrderItem): string {
  return [spiceLabel(item.spice), ...item.options.map((o) => o.name)].filter(Boolean).join(" · ")
}

export async function sendOrderConfirmationEmail(params: ConfirmationEmailParams) {
  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/suivi/${params.publicToken}`
  const firstName = params.customerName.trim().split(/\s+/)[0] ?? ""

  // Palette de la marque : liboke #E2572B, kwanga #FAF3E8, encre #2B1B12
  const itemsHtml = params.items
    .map((item) => {
      const detail = itemDetail(item)
      return `
      <tr>
        <td style="padding:8px 0;color:#2B1B12;font-size:15px;">
          <strong>${item.quantity} ×</strong> ${escapeHtml(item.dish_name)}
          ${detail ? `<br><span style="color:#6B5B50;font-size:13px;">${escapeHtml(detail)}</span>` : ""}
        </td>
        <td style="padding:8px 0;color:#2B1B12;font-size:15px;text-align:right;white-space:nowrap;vertical-align:top;">
          ${formatPrice(item.unit_price_cents * item.quantity)}
        </td>
      </tr>`
    })
    .join("")

  const deliveryLine =
    params.type === "livraison"
      ? `Livraison : ${escapeHtml(`${params.address ?? ""} ${params.postalCode ?? ""}`.trim())}`
      : "À emporter : Nathy te contacte pour convenir de l'heure."
  const paymentLine =
    params.paymentMethod === "especes" ? "À régler en espèces à la réception." : "Payé par carte bancaire."

  const html = `
    <div style="background:#FAF3E8;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#FFFCF6;border-radius:24px;overflow:hidden;">
        <div style="background:#E2572B;padding:24px;">
          <p style="color:#FAF3E8;font-weight:bold;font-size:15px;margin:0 0 6px;">Chez ya Nathy</p>
          <h1 style="color:#FFFFFF;font-size:26px;line-height:1.15;margin:0;">Mbote ${escapeHtml(firstName)} ! Ta commande est bien reçue.</h1>
        </div>
        <div style="padding:24px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
            ${itemsHtml}
          </table>
          <table style="width:100%;border-collapse:collapse;border-top:2px solid #F2E4CC;">
            <tr>
              <td style="padding-top:10px;color:#6B5B50;font-size:14px;">Sous-total</td>
              <td style="padding-top:10px;color:#6B5B50;font-size:14px;text-align:right;">${formatPrice(params.subtotalCents)}</td>
            </tr>
            ${params.deliveryFeeCents > 0 ? `
            <tr>
              <td style="color:#6B5B50;font-size:14px;">Livraison</td>
              <td style="color:#6B5B50;font-size:14px;text-align:right;">${formatPrice(params.deliveryFeeCents)}</td>
            </tr>` : ""}
            <tr>
              <td style="padding-top:6px;color:#2B1B12;font-weight:bold;font-size:17px;">Total</td>
              <td style="padding-top:6px;color:#2B1B12;font-weight:bold;font-size:17px;text-align:right;">${formatPrice(params.totalCents)}</td>
            </tr>
          </table>

          <p style="color:#2B1B12;font-size:14px;margin:20px 0 4px;">${deliveryLine}</p>
          <p style="color:#2B1B12;font-size:14px;margin:0 0 24px;">${paymentLine}</p>

          <a href="${trackingUrl}" style="display:block;text-align:center;background:#2B1B12;color:#FAF3E8;font-weight:bold;text-decoration:none;padding:16px;border-radius:999px;font-size:16px;">
            Suivre ma commande
          </a>
        </div>
      </div>
    </div>
  `

  const text = [
    `Mbote ${firstName} ! Ta commande est bien reçue.`,
    "",
    ...params.items.map((i) => {
      const detail = itemDetail(i)
      return `${i.quantity} x ${i.dish_name}${detail ? ` (${detail})` : ""} : ${formatPrice(i.unit_price_cents * i.quantity)}`
    }),
    "",
    `Total : ${formatPrice(params.totalCents)}`,
    params.type === "livraison"
      ? `Livraison : ${`${params.address ?? ""} ${params.postalCode ?? ""}`.trim()}`
      : "À emporter : Nathy te contacte pour convenir de l'heure.",
    paymentLine,
    "",
    `Suivre ma commande : ${trackingUrl}`,
  ].join("\n")

  await resend.emails.send({
    from:    EMAIL_FROM,
    to:      params.email,
    subject: "Ta commande Chez ya Nathy est bien reçue",
    html,
    text,
  })
}
