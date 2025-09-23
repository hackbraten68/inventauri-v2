import ProtectedRoute from "@/components/protected-route";
import ItemsTable from "@/components/ItemsTable";

export default function ItemsPage() {
  return (
    <ProtectedRoute>
      <ItemsTable />
    </ProtectedRoute>
  );
}
