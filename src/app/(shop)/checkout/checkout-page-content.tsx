"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ShoppingBag,
  MapPin,
  Plus,
  Truck,
  Package,
  CreditCard,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getCart } from "@/actions/cart";
import { getAddresses } from "@/actions/addresses";
import { createOrder } from "@/actions/orders";
import { createPayment } from "@/actions/payments";
import { useCart } from "@/context/cart-context";
import { currency } from "@/utils/currency";
import { cn } from "@/lib/utils";

type PaymentMethodType = "pix" | "billing";

const PAYMENT_METHODS: {
  value: PaymentMethodType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    value: "pix",
    label: "PIX",
    icon: QrCode,
    description: "QR Code direto, aprovação instantânea",
  },
  {
    value: "billing",
    label: "Cartão de crédito / PIX",
    icon: CreditCard,
    description: "Checkout seguro com cartão ou PIX",
  },
];

type CartItem = {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; price: number };
  variant?: { id: string; name?: string; size?: string; price_delta?: number } | null;
};

type Address = {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
};

type ShippingOption = {
  service_code: string;
  service_name: string;
  price: number;
  deadline_days: number;
};

export function CheckoutPageContent() {
  const router = useRouter();
  const { syncToServer, clear: clearCart } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("pix");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingSource, setShippingSource] = useState<string | null>(null);

  const [cpf, setCpf] = useState("");

  // Credit card fields

  useEffect(() => {
    async function load() {
      try {
        const [cartResult, addrsResult] = await Promise.all([
          getCart(),
          getAddresses(),
        ]);
        setItems((cartResult.items as any) ?? []);
        setAddresses(addrsResult as Address[]);
      } catch {
        toast.error("Erro ao carregar dados do checkout");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAddressSelect(addressId: string) {
    setSelectedAddressId(addressId);
    setSelectedShipping(null);
    setShippingOptions([]);
    setShippingSource(null);

    const addr = addresses.find((a) => a.id === addressId);
    if (!addr) return;

    setShippingLoading(true);
    try {
      const { getShippingOptions } = await import("@/actions/shipping");
      const result = await getShippingOptions(addr.zip_code);
      setShippingOptions(result.options);
      setShippingSource(result.source ?? null);
    } catch {
      toast.error("Erro ao calcular frete");
    } finally {
      setShippingLoading(false);
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const shippingCost = selectedShipping?.price ?? 0;
  const orderTotal = subtotal + shippingCost;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAddressId) {
      toast.error("Selecione um endereço de entrega.");
      return;
    }

    if (!selectedShipping) {
      toast.error("Selecione uma opção de frete.");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      toast.error("Informe um CPF ou CNPJ válido.");
      return;
    }

    setSubmitting(true);
    try {
      // 0. Sync cart from localStorage to server
      await syncToServer();

      // 1. Create order
      const order = await createOrder({
        paymentMethod,
        shippingAddressId: selectedAddressId,
        couponCode: couponCode.trim() || undefined,
        shippingServiceCode: selectedShipping.service_code,
      });

      if (!order?.id) {
        toast.error("Erro ao criar o pedido.");
        return;
      }

      // 2. Create payment via AbacatePay v1
      const paymentInput: any = {
        orderId: order.id,
        customer: {
          taxId: cleanCpf,
        },
        payment:
          paymentMethod === "pix"
            ? { method: "pix", expiresIn: 3600 }
            : { method: "billing" },
      };

      const payment = await createPayment(paymentInput);

      // 3. Redirect based on payment method
      if (paymentMethod === "billing" && payment?.boleto_url) {
        // Billing link — redirect to AbacatePay payment page
        toast.success("Redirecionando para o pagamento...");
        window.location.href = payment.boleto_url;
      } else {
        await clearCart();
        toast.success("Pedido criado! Complete o pagamento.");
        router.push(`/checkout/payment/${order.id}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o pedido."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin opacity-60" />
          <h1 className="text-xl font-bold">Carregando checkout</h1>
          <p className="text-sm text-muted-foreground">
            Buscando os itens do carrinho antes de finalizar o pedido.
          </p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShoppingBag className="size-10 opacity-60" />
          <h1 className="text-xl font-bold">Não há itens para finalizar</h1>
          <p className="text-sm text-muted-foreground">
            Adicione produtos ao carrinho antes de finalizar a compra.
          </p>
          <Button asChild>
            <Link href="/products">Ir para o catálogo</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1.2fr_420px]">
      <section className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Fechar pedido</h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* CPF / CNPJ */}
          <div className="grid gap-2">
            <Label htmlFor="cpf">CPF / CNPJ</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={18}
            />
          </div>

          {/* Payment method selector */}
          <div className="space-y-3">
            <Label>Método de pagamento</Label>
            <div className="grid gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.value;
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Icon className="size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{pm.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {pm.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coupon */}
          <div className="grid gap-2">
            <Label htmlFor="coupon-code">Cupom de desconto</Label>
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código do cupom"
            />
          </div>

          {/* Address selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Endereço de entrega</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                asChild
              >
                <Link href="/account/addresses">
                  <Plus className="mr-1 size-3" />
                  Gerenciar
                </Link>
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                <p>Nenhum endereço cadastrado.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  asChild
                >
                  <Link href="/account/addresses">Cadastrar endereço</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleAddressSelect(addr.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {addr.street}, {addr.number}
                          {addr.complement ? ` - ${addr.complement}` : ""}
                        </p>
                        <p className="text-muted-foreground">
                          {addr.neighborhood} - {addr.city}/{addr.state}
                        </p>
                        <p className="text-muted-foreground">
                          CEP: {addr.zip_code}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipping options */}
          {selectedAddressId ? (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Truck className="size-4" />
                Opções de frete
              </Label>

              {shippingLoading ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Calculando frete...
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Nenhuma opção de frete disponível para este endereço.
                </div>
              ) : (
                <div className="grid gap-2">
                  {shippingOptions.map((option) => {
                    const isSelected =
                      selectedShipping?.service_code === option.service_code;
                    return (
                      <button
                        key={option.service_code}
                        type="button"
                        onClick={() => setSelectedShipping(option)}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="size-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{option.service_name}</p>
                            <p className="text-muted-foreground">
                              {option.deadline_days === 1
                                ? "1 dia útil"
                                : `${option.deadline_days} dias úteis`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {option.price === 0 ? (
                            <span className="font-bold text-green-600">Grátis</span>
                          ) : (
                            <span className="font-bold">{currency(option.price)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {shippingSource === "fallback" ? (
                    <p className="text-xs text-muted-foreground">
                      * Valores estimados. O valor final pode variar.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !selectedAddressId || !selectedShipping}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {submitting ? "Processando..." : "Confirmar e pagar"}
          </Button>
        </form>
      </section>

      <aside className="h-fit space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Resumo do pedido</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div>
                <div className="font-medium">{item.product.name}</div>
                <div className="text-muted-foreground">
                  {item.variant?.size ? `${item.variant.size} - ` : ""}
                  {item.quantity}x {currency(Number(item.price))}
                </div>
              </div>
              <div className="font-semibold">
                {currency(Number(item.price) * item.quantity)}
              </div>
            </div>
          ))}
        </div>
        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{currency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Frete</span>
            {selectedShipping ? (
              <span>
                {shippingCost === 0 ? (
                  <span className="font-medium text-green-600">Grátis</span>
                ) : (
                  currency(shippingCost)
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {selectedAddressId ? "Selecione o frete" : "Selecione o endereço"}
              </span>
            )}
          </div>
        </div>

        <Separator />
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-black">{currency(orderTotal)}</span>
        </div>
      </aside>
    </main>
  );
}
