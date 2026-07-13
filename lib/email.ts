import { resend, EMAIL_FROM } from "@/lib/resend"
import { formatPrice } from "@/lib/utils"
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

export async function sendOrderConfirmationEmail(params: ConfirmationEmailParams) {
  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/suivi/${params.publicToken}`

  const itemsHtml = params.items
    .map((item) => `
      <tr>
        <td style="padding:8px 0;color:#2A1E1A;font-size:14px;">
          ${item.quantity}× ${item.dish_name}
          ${item.spice ? `<span style="color:#8a7d78;">· ${item.spice}</span>` : ""}
        </td>
        <td style="padding:8px 0;color:#2A1E1A;font-size:14px;text-align:right;white-space:nowrap;">
          ${formatPrice(item.unit_price_cents * item.quantity)}
        </td>
      </tr>
    `)
    .join("")

  const html = `
    <div style="background:#FAF3E8;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px 24px;">
        <p style="color:#E2572B;font-weight:bold;font-size:20px;margin:0 0 4px;">Chez ya Nathy</p>
        <h1 style="color:#2A1E1A;font-size:22px;margin:0 0 8px;">Commande reçue !</h1>
        <p style="color:#6b5f5a;font-size:14px;margin:0 0 24px;">
          Merci ${params.customerName.split(" ")[0]} 🙏 Nathy a bien reçu votre commande.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
          ${itemsHtml}
        </table>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;padding-top:8px;">
          <tr>
            <td style="padding-top:8px;color:#6b5f5a;font-size:13px;">Sous-total</td>
            <td style="padding-top:8px;color:#6b5f5a;font-size:13px;text-align:right;">${formatPrice(params.subtotalCents)}</td>
          </tr>
          ${params.deliveryFeeCents > 0 ? `
          <tr>
            <td style="color:#6b5f5a;font-size:13px;">Livraison</td>
            <td style="color:#6b5f5a;font-size:13px;text-align:right;">${formatPrice(params.deliveryFeeCents)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding-top:6px;color:#2A1E1A;font-weight:bold;font-size:15px;">Total</td>
            <td style="padding-top:6px;color:#2A1E1A;font-weight:bold;font-size:15px;text-align:right;">${formatPrice(params.totalCents)}</td>
          </tr>
        </table>

        <p style="color:#6b5f5a;font-size:13px;margin:20px 0 4px;">
          ${params.type === "livraison"
            ? `🛵 Livraison — ${params.address ?? ""} ${params.postalCode ?? ""}`
            : "🥡 À emporter"
          }
        </p>
        <p style="color:#6b5f5a;font-size:13px;margin:0 0 24px;">
          ${params.paymentMethod === "especes"
            ? "💵 À régler en espèces à la réception."
            : "💳 Payé par carte bancaire."
          }
        </p>

        <a href="${trackingUrl}" style="display:block;text-align:center;background:#E2572B;color:#ffffff;font-weight:bold;text-decoration:none;padding:14px;border-radius:12px;font-size:15px;">
          Suivre ma commande →
        </a>
      </div>
    </div>
  `

  const text = [
    `Commande reçue ! Merci ${params.customerName.split(" ")[0]}, Nathy a bien reçu votre commande.`,
    "",
    ...params.items.map((i) => `${i.quantity}x ${i.dish_name} — ${formatPrice(i.unit_price_cents * i.quantity)}`),
    "",
    `Total : ${formatPrice(params.totalCents)}`,
    "",
    `Suivre ma commande : ${trackingUrl}`,
  ].join("\n")

  await resend.emails.send({
    from:    EMAIL_FROM,
    to:      params.email,
    subject: "Votre commande Chez ya Nathy est confirmée",
    html,
    text,
  })
}
