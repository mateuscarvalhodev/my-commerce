"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { simulatePayment } from "@/actions/simulate-payment";

export default function SimulatePaymentPage() {
  const [pixId, setPixId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const id = pixId.trim();
    if (!id) {
      toast.error("Informe o ID da cobrança PIX.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await simulatePayment(id);
      setResult(res);
      toast.success("Pagamento simulado com sucesso!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao simular pagamento"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="size-5" />
        <h1 className="text-2xl font-bold">Simular Pagamento PIX</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Insira o ID da cobrança PIX (retornado pelo AbacatePay) para simular a
        confirmação do pagamento em ambiente de desenvolvimento.
      </p>

      <form
        onSubmit={handleSubmit}
        className="max-w-md space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="pix-id">ID da cobrança PIX</Label>
          <Input
            id="pix-id"
            value={pixId}
            onChange={(e) => setPixId(e.target.value)}
            placeholder="Ex: abc123..."
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Zap className="mr-2 size-4" />
          )}
          Simular pagamento
        </Button>
      </form>

      {result ? (
        <div className="max-w-md rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="size-5" />
            <span className="font-semibold">Pagamento simulado</span>
          </div>
          <pre className="mt-2 overflow-auto rounded bg-white p-3 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
