import { useEffect, useState } from "react";
import { http } from "../lib/api";
import { Card, Loader, Select, StatusBadge } from "../components/ui";
import { Button } from "../components/ui";
import { format } from "date-fns";

export default function AdminUsersPage() {
  const [users, setUsers] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    http.get(`/admin/users?${params}`).then(setUsers).catch(() => setUsers([]));
  }
  useEffect(load, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function action(id, type) {
    if (type === "reject" && !confirm("Reject this user's verification?")) return;
    if (type === "suspend" && !confirm("Suspend this account?")) return;
    await http.patch(`/admin/users/${id}/${type}`, type === "reject" ? { reason: "Documents did not meet requirements" } : undefined);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">Users</h1>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[220px]">
          <option value="">All statuses</option>
          <option value="PENDING_VERIFICATION">Pending verification</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      {!users ? (
        <Loader />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-navy">{u.email}</p>
                  <p className="text-xs text-taupe">
                    {u.role.replaceAll("_", " ")} · {u.mobile} · joined {format(new Date(u.createdAt), "d MMM yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={u.status} />
                  {u.status === "PENDING_VERIFICATION" && (
                    <>
                      <Button size="sm" onClick={() => action(u.id, "verify")}>
                        Verify
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => action(u.id, "reject")}>
                        Reject
                      </Button>
                    </>
                  )}
                  {u.status === "ACTIVE" && u.role !== "ADMIN" && (
                    <Button size="sm" variant="ghost" onClick={() => action(u.id, "suspend")}>
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
