"use client";

import { useEffect, useState } from "react";
import { getAdminStats } from "@/actions/admin";
import { currency } from "@/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    totalRevenue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch {
        // Error loading stats
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <Separator />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita total
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {currency(stats?.totalRevenue ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{stats?.totalOrders ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{stats?.totalCustomers ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
