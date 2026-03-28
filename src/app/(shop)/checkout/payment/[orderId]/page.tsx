"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  QrCode,
  FileText,
  Copy,
  ExternalLink,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPaymentByOrder } from "@/actions/payments";
import { currency, cn } from "@/lib/utils";

export default function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPayment = useCallback(async () => {
    try {
      const data = await getPaymentByOrder(orderId);
      setPayment(data);
      return data;
    } catch {
      setError(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  // Poll every 5 seconds while pending
  useEffect(() => {
    if (!payment || payment.status === "paid" || payment.status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      const data = await fetchPayment();
      if (data?.status === "paid" || data?.status === "failed") {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [payment?.status, fetchPayment]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin opacity-60" />
          <h1 className="text-xl font-bold">Carregando pagamento...</h1>
        </div>
      </main>
    );
  }

  if (error || !payment) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="size-10 text-destructive" />
          <h1 className="text-xl font-bold">Pagamento nao encontrado</h1>
          <Button asChild>
            <Link href="/account/orders">Ver meus pedidos</Link>
          </Button>
        </div>
      </main>
    );
  }

  // Payment confirmed
  if (payment.status === "paid") {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <CheckCircle2 className="size-16 text-green-500" />
          <div>
            <h1 className="text-2xl font-black">Pagamento confirmado!</h1>
            <p className="mt-2 text-muted-foreground">
              Seu pedido foi confirmado e esta sendo processado.
            </p>
          </div>
          <Button asChild>
            <Link href="/account/orders">Ver meus pedidos</Link>
          </Button>
        </div>
      </main>
    );
  }

  // Payment failed
  if (payment.status === "failed") {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <XCircle className="size-16 text-destructive" />
          <div>
            <h1 className="text-2xl font-black">Pagamento recusado</h1>
            <p className="mt-2 text-muted-foreground">
              O pagamento nao foi aprovado. Tente novamente.
            </p>
          </div>
          <Button asChild>
            <Link href="/account/orders">Ver meus pedidos</Link>
          </Button>
        </div>
      </main>
    );
  }

  const meta = payment.metadata as Record<string, any> | null;
  const amountFormatted = currency(
    payment.amount_cents ? payment.amount_cents / 100 : payment.amount ?? 0
  );

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Clock className="size-6 text-amber-500" />
          <div>
            <h1 className="text-xl font-black">Aguardando pagamento</h1>
            <p className="text-sm text-muted-foreground">
              Valor: {amountFormatted}
            </p>
          </div>
        </div>

        <Separator />

        {/* PIX payment */}
        {payment.method === "pix" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <QrCode className="size-4" />
              Pague com PIX
            </div>

            {(payment.pix_qr_code_url || meta?.pix_qr_code_url) ? (
              <div className="flex justify-center">
                <img
                  src={payment.pix_qr_code_url ?? meta?.pix_qr_code_url}
                  alt="QR Code PIX"
                  className="size-52 rounded-lg border"
                />
              </div>
            ) : null}

            {(payment.pix_qr_code || meta?.pix_qr_code) ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Ou copie o codigo PIX:
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={payment.pix_qr_code ?? meta?.pix_qr_code}
                    className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        payment.pix_qr_code ?? meta?.pix_qr_code
                      )
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            {(payment.pix_expires_at || meta?.pix_expires_at) ? (
              <p className="text-xs text-muted-foreground">
                Expira em:{" "}
                {new Date(
                  payment.pix_expires_at ?? meta?.pix_expires_at
                ).toLocaleString("pt-BR")}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Boleto payment */}
        {payment.method === "boleto" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4" />
              Boleto bancario
            </div>

            {(payment.boleto_barcode || meta?.boleto_barcode) ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Codigo de barras:
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={
                      payment.boleto_barcode ?? meta?.boleto_barcode
                    }
                    className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        payment.boleto_barcode ?? meta?.boleto_barcode
                      )
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            {(payment.boleto_url || meta?.boleto_url) ? (
              <Button asChild variant="outline" className="w-full">
                <a
                  href={payment.boleto_url ?? meta?.boleto_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 size-4" />
                  Abrir boleto
                </a>
              </Button>
            ) : null}

            {(payment.boleto_due_date || meta?.boleto_due_date) ? (
              <p className="text-xs text-muted-foreground">
                Vencimento:{" "}
                {new Date(
                  payment.boleto_due_date ?? meta?.boleto_due_date
                ).toLocaleDateString("pt-BR")}
              </p>
            ) : null}
          </div>
        ) : null}

        <Separator />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Status:{" "}
            <span
              className={cn(
                "font-medium",
                payment.status === "pending" && "text-amber-600",
                payment.status === "processing" && "text-blue-600"
              )}
            >
              {payment.status === "pending"
                ? "Aguardando pagamento"
                : payment.status === "processing"
                  ? "Processando"
                  : payment.status}
            </span>
          </span>
          <Loader2 className="size-3 animate-spin" />
        </div>

        <Button variant="ghost" className="w-full" asChild>
          <Link href="/account/orders">Ver meus pedidos</Link>
        </Button>
      </div>
    </main>
  );
}
