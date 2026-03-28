"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ShoppingBag,
  MapPin,
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
import { getAddresses } from "@/actions/addresses";
import { createOrder } from "@/actions/orders";
import { createPayment } from "@/actions/payments";
import { guestCheckout } from "@/actions/guest-checkout";
import { useCart } from "@/context/cart-context";
import { createClient } from "@/lib/supabase/client";
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
  const { items: cartItems, syncToServer, clear: clearCart, subtotal } = useCart();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("pix");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [cpf, setCpf] = useState("");

  // Guest fields
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestStreet, setGuestStreet] = useState("");
  const [guestNumber, setGuestNumber] = useState("");
  const [guestComplement, setGuestComplement] = useState("");
  const [guestNeighborhood, setGuestNeighborhood] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [guestState, setGuestState] = useState("");
  const [guestCep, setGuestCep] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        try {
          const addrs = await getAddresses();
          setAddresses(addrs as Address[]);
        } catch {}
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleAddressSelect(addressId: string) {
    setSelectedAddressId(addressId);
    setSelectedShipping(null);
    setShippingOptions([]);

    const addr = addresses.find((a) => a.id === addressId);
    if (addr) await fetchShipping(addr.zip_code);
  }

  async function handleGuestCepBlur() {
    const clean = guestCep.replace(/\D/g, "");
    if (clean.length === 8) await fetchShipping(clean);
  }

  async function fetchShipping(cep: string) {
    setShippingLoading(true);
    setSelectedShipping(null);
    setShippingOptions([]);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_cep: cep.replace(/\D/g, ""),
          items: cartItems.map((i) => ({ product_id: String(i.id), quantity: i.qty })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShippingOptions(data.options ?? []);
      }
    } catch {} finally {
      setShippingLoading(false);
    }
  }

  const shippingCost = selectedShipping?.price ?? 0;
  const orderTotal = subtotal + shippingCost;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedShipping) {
      toast.error("Selecione uma opção de frete.");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      toast.error("Informe um CPF ou CNPJ válido.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Carrinho vazio.");
      return;
    }

    setSubmitting(true);
    try {
      let orderId: string;
      let userId: string | undefined;

      if (isLoggedIn) {
        if (!selectedAddressId) {
          toast.error("Selecione um endereço de entrega.");
          setSubmitting(false);
          return;
        }

        await syncToServer();

        const order = await createOrder({
          paymentMethod,
          shippingAddressId: selectedAddressId,
          couponCode: couponCode.trim() || undefined,
          shippingServiceCode: selectedShipping.service_code,
        });

        if (!order?.id) throw new Error("Erro ao criar o pedido.");
        orderId = order.id;
      } else {
        if (!guestEmail.trim()) {
          toast.error("Informe seu e-mail.");
          setSubmitting(false);
          return;
        }
        if (!guestStreet || !guestNumber || !guestNeighborhood || !guestCity || !guestState || !guestCep) {
          toast.error("Preencha todos os campos do endereço.");
          setSubmitting(false);
          return;
        }

        const result = await guestCheckout({
          email: guestEmail.trim(),
          name: guestName.trim() || undefined,
          items: cartItems.map((i) => ({
            product_id: String(i.id),
            variant_id: undefined,
            quantity: i.qty,
            price: i.price,
          })),
          address: {
            street: guestStreet,
            number: guestNumber,
            complement: guestComplement || undefined,
            neighborhood: guestNeighborhood,
            city: guestCity,
            state: guestState,
            zip_code: guestCep.replace(/\D/g, ""),
          },
          paymentMethod,
          couponCode: couponCode.trim() || undefined,
          shippingServiceCode: selectedShipping.service_code,
          cpf: cleanCpf,
        });

        orderId = result.order.id;
        userId = result.userId;
      }

      const payment = await createPayment({
        orderId,
        userId,
        customer: { taxId: cleanCpf },
        payment:
          paymentMethod === "pix"
            ? { method: "pix", expiresIn: 3600 }
            : { method: "billing" },
      });

      await clearCart();

      if (paymentMethod === "billing" && payment?.boleto_url) {
        toast.success("Redirecionando para o pagamento...");
        window.location.href = payment.boleto_url;
      } else {
        toast.success("Pedido criado! Complete o pagamento.");
        router.push(`/checkout/payment/${orderId}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível concluir o pedido."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin opacity-60" />
          <h1 className="text-xl font-bold">Carregando checkout</h1>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShoppingBag className="size-10 opacity-60" />
          <h1 className="text-xl font-bold">Não há itens para finalizar</h1>
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
        <h1 className="text-2xl font-black tracking-tight">Fechar pedido</h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* ─── Guest info ────────────────────────────────────── */}
          {isLoggedIn === false ? (
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <p className="text-sm font-semibold">Seus dados</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="guest-email">E-mail *</Label>
                  <Input id="guest-email" type="email" required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="guest-name">Nome</Label>
                  <Input id="guest-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Seu nome" />
                </div>
              </div>

              <Separator />
              <p className="text-sm font-semibold">Endereço de entrega</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Rua *</Label>
                  <Input value={guestStreet} onChange={(e) => setGuestStreet(e.target.value)} placeholder="Rua, Av..." required />
                </div>
                <div className="grid gap-2">
                  <Label>Número *</Label>
                  <Input value={guestNumber} onChange={(e) => setGuestNumber(e.target.value)} placeholder="123" required />
                </div>
                <div className="grid gap-2">
                  <Label>Complemento</Label>
                  <Input value={guestComplement} onChange={(e) => setGuestComplement(e.target.value)} placeholder="Apto, bloco..." />
                </div>
                <div className="grid gap-2">
                  <Label>Bairro *</Label>
                  <Input value={guestNeighborhood} onChange={(e) => setGuestNeighborhood(e.target.value)} placeholder="Bairro" required />
                </div>
                <div className="grid gap-2">
                  <Label>Cidade *</Label>
                  <Input value={guestCity} onChange={(e) => setGuestCity(e.target.value)} placeholder="Cidade" required />
                </div>
                <div className="grid gap-2">
                  <Label>Estado *</Label>
                  <Input value={guestState} onChange={(e) => setGuestState(e.target.value)} placeholder="SP" maxLength={2} required />
                </div>
                <div className="grid gap-2">
                  <Label>CEP *</Label>
                  <Input value={guestCep} onChange={(e) => setGuestCep(e.target.value)} onBlur={handleGuestCepBlur} placeholder="00000-000" maxLength={9} required />
                </div>
              </div>
            </div>
          ) : null}

          {/* ─── CPF ─────────────────────────────────────────────── */}
          <div className="grid gap-2">
            <Label htmlFor="cpf">CPF / CNPJ</Label>
            <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" maxLength={18} />
          </div>

          {/* ─── Payment method ──────────────────────────────────── */}
          <div className="space-y-3">
            <Label>Método de pagamento</Label>
            <div className="grid gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.value;
                const Icon = pm.icon;
                return (
                  <button key={pm.value} type="button" onClick={() => setPaymentMethod(pm.value)} className={cn("flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors", isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50")}>
                    <Icon className="size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{pm.label}</p>
                      <p className="text-xs text-muted-foreground">{pm.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Coupon ──────────────────────────────────────────── */}
          <div className="grid gap-2">
            <Label htmlFor="coupon-code">Cupom de desconto</Label>
            <Input id="coupon-code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Código do cupom" />
          </div>

          {/* ─── Address (logged in) ─────────────────────────────── */}
          {isLoggedIn ? (
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><MapPin className="size-4" /> Endereço de entrega</Label>
              {addresses.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <p>Nenhum endereço cadastrado.</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/account/addresses">Cadastrar endereço</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {addresses.map((addr) => (
                    <button key={addr.id} type="button" onClick={() => handleAddressSelect(addr.id)} className={cn("flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors", selectedAddressId === addr.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50")}>
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{addr.street}, {addr.number}</p>
                        <p className="text-muted-foreground">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                        <p className="text-muted-foreground">CEP: {addr.zip_code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* ─── Shipping ────────────────────────────────────────── */}
          {(selectedAddressId || (!isLoggedIn && guestCep.replace(/\D/g, "").length === 8)) ? (
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Truck className="size-4" /> Opções de frete</Label>
              {shippingLoading ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Calculando frete...
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Nenhuma opção de frete disponível.
                </div>
              ) : (
                <div className="grid gap-2">
                  {shippingOptions.map((opt) => (
                    <button key={opt.service_code} type="button" onClick={() => setSelectedShipping(opt)} className={cn("flex items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors", selectedShipping?.service_code === opt.service_code ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50")}>
                      <div className="flex items-center gap-3">
                        <Package className="size-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{opt.service_name}</p>
                          <p className="text-muted-foreground">{opt.deadline_days === 1 ? "1 dia útil" : `${opt.deadline_days} dias úteis`}</p>
                        </div>
                      </div>
                      <span className="font-bold">{opt.price === 0 ? <span className="text-green-600">Grátis</span> : currency(opt.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting || !selectedShipping}>
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {submitting ? "Processando..." : "Confirmar e pagar"}
          </Button>
        </form>
      </section>

      {/* ─── Summary ─────────────────────────────────────────── */}
      <aside className="h-fit space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Resumo do pedido</h2>
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={`${item.id}-${item.size ?? "un"}`} className="flex items-center justify-between gap-3 text-sm">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-muted-foreground">{item.size ? `${item.size} · ` : ""}{item.qty}x {currency(item.price)}</div>
              </div>
              <div className="font-semibold">{currency(item.price * item.qty)}</div>
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
              <span>{shippingCost === 0 ? <span className="font-medium text-green-600">Grátis</span> : currency(shippingCost)}</span>
            ) : (
              <span className="text-muted-foreground">Selecione o frete</span>
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
