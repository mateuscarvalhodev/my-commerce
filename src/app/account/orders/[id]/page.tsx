import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrder } from "@/actions/orders";
import { currency, cn } from "@/lib/utils";
import { CancelOrderButton } from "../cancel-order-button";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-800" },
  processing: {
    label: "Processando",
    className: "bg-blue-100 text-blue-800",
  },
  shipped: { label: "Enviado", className: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregue", className: "bg-green-100 text-green-800" },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800",
  },
  refunded: {
    label: "Reembolsado",
    className: "bg-gray-100 text-gray-800",
  },
};

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Aguardando",
    className: "bg-amber-100 text-amber-800",
  },
  processing: {
    label: "Processando",
    className: "bg-blue-100 text-blue-800",
  },
  paid: { label: "Pago", className: "bg-green-100 text-green-800" },
  failed: { label: "Falhou", className: "bg-red-100 text-red-800" },
  refunded: {
    label: "Reembolsado",
    className: "bg-gray-100 text-gray-800",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800",
  },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order;
  try {
    order = await getOrder(id);
  } catch {
    notFound();
  }

  if (!order) notFound();

  const status = STATUS_MAP[order.status] ?? {
    label: order.status,
    className: "bg-gray-100 text-gray-800",
  };

  const payment = (order as any).payments?.[0] ?? null;
  const shippingAddress = (order as any).shipping_address;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/account/orders">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={cn(
            "ml-auto inline-flex rounded-full px-3 py-1 text-xs font-medium",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Order items */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Itens do pedido</h2>
        <div className="space-y-3">
          {order.order_items?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <Package className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {item.product_name ?? item.product?.name ?? "Produto"}
                  </p>
                  {item.variant_name ? (
                    <p className="text-xs text-muted-foreground">
                      {item.variant_name}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {item.quantity}x{" "}
                    {currency(item.unit_price ?? item.price ?? 0)}
                  </p>
                </div>
              </div>
              <p className="font-semibold">
                {currency(
                  (item.unit_price ?? item.price ?? 0) * item.quantity
                )}
              </p>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>
              {currency(
                order.total - (order.shipping_cost ?? 0)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span>
              {order.shipping_cost === 0
                ? "Gratis"
                : currency(order.shipping_cost ?? 0)}
            </span>
          </div>
          {order.shipping_service ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Servico</span>
              <span>{order.shipping_service}</span>
            </div>
          ) : null}
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{currency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {shippingAddress ? (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Endereco de entrega</h2>
          <p className="text-sm">
            {shippingAddress.street}, {shippingAddress.number}
            {shippingAddress.complement
              ? ` - ${shippingAddress.complement}`
              : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {shippingAddress.neighborhood} - {shippingAddress.city}/
            {shippingAddress.state}
          </p>
          <p className="text-sm text-muted-foreground">
            CEP: {shippingAddress.zip_code}
          </p>
        </div>
      ) : null}

      {/* Payment */}
      {payment ? (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Pagamento</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Metodo:</span>
            <span className="font-medium">
              {payment.method === "pix"
                ? "PIX"
                : payment.method === "credit_card"
                  ? "Cartao de credito"
                  : payment.method === "boleto"
                    ? "Boleto"
                    : payment.method}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                (
                  PAYMENT_STATUS_MAP[payment.status] ?? {
                    className: "bg-gray-100 text-gray-800",
                  }
                ).className
              )}
            >
              {(PAYMENT_STATUS_MAP[payment.status] ?? { label: payment.status })
                .label}
            </span>
          </div>
        </div>
      ) : null}

      {/* Cancel button */}
      {order.status === "pending" ? (
        <div className="flex justify-end">
          <CancelOrderButton orderId={order.id} />
        </div>
      ) : null}
    </div>
  );
}
