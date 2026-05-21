import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const mpPayment = new Payment(mp);
export const mpPreference = new Preference(mp);

export type PixPaymentResult = {
  id: string;
  qrCode: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
};

export async function createPixPayment(params: {
  amount: number;
  description: string;
  payerEmail: string;
  externalReference: string;
}): Promise<PixPaymentResult> {
  const result = await mpPayment.create({
    body: {
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: "pix",
      payer: { email: params.payerEmail },
      external_reference: params.externalReference,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    },
  });

  const pointOfInteraction = result.point_of_interaction as {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };

  return {
    id: String(result.id),
    qrCode: pointOfInteraction?.transaction_data?.qr_code ?? "",
    qrCodeBase64: pointOfInteraction?.transaction_data?.qr_code_base64 ?? "",
    pixCopyPaste: pointOfInteraction?.transaction_data?.qr_code ?? "",
  };
}

export async function createPaymentLink(params: {
  title: string;
  amount: number;
  externalReference: string;
}): Promise<string> {
  const result = await mpPreference.create({
    body: {
      items: [
        {
          id: params.externalReference,
          title: params.title,
          quantity: 1,
          unit_price: params.amount,
        },
      ],
      external_reference: params.externalReference,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${params.externalReference}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${params.externalReference}`,
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    },
  });

  return result.init_point ?? "";
}
