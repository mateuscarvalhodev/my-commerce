import { getAdminCustomers } from "@/actions/admin";

export default async function AdminCustomersPage() {
  const result = await getAdminCustomers();
  const customers = result.data as Array<{
    id: string;
    name: string | null;
    full_name: string | null;
    email: string;
    role: string;
    created_at: string;
  }>;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Clientes</h2>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, i) => (
              <tr
                key={customer.id}
                className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
              >
                <td className="px-4 py-3 font-medium">
                  {customer.name ?? customer.full_name ?? "---"}
                </td>
                <td className="px-4 py-3">{customer.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      customer.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {customer.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
