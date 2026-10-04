import { useEffect, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { format } from "date-fns";
import { apiErrorMessage, http } from "../lib/api";
import {
  Button,
  Card,
  ErrorState,
  Input,
  Loader,
  Select,
  StatusBadge,
} from "../components/ui";

export default function AdminUsersPage() {
  const [users, setUsers] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [busyId, setBusyId] = useState("");

  function load() {
    setUsers(null);
    setError("");
    setReloadCount((count) => count + 1);
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (roleFilter) params.set("role", roleFilter);
    http
      .get(`/admin/users?${params}`)
      .then(setUsers)
      .catch((requestError) => {
        setError(apiErrorMessage(requestError, "Unable to load users."));
      });
  }, [statusFilter, roleFilter, reloadCount]);

  async function action(id, type) {
    if (type === "reject" && !confirm("Reject this user's verification?")) return;
    if (type === "suspend" && !confirm("Suspend this account?")) return;
    if (type === "restore" && !confirm("Restore this account's sign-in access?")) return;
    setError("");
    setBusyId(id);
    try {
      await http.patch(
        `/admin/users/${id}/${type}`,
        type === "reject"
          ? { reason: "Documents did not meet requirements" }
          : undefined
      );
      load();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to update this account."));
    } finally {
      setBusyId("");
    }
  }

  const visibleUsers = (users || []).filter((user) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      user.email.toLowerCase().includes(query) ||
      user.mobile.includes(query) ||
      user.role.toLowerCase().replaceAll("_", " ").includes(query)
    );
  });

  return (
    <div className="admin-page mx-auto w-full max-w-[1440px] space-y-7">
      <header className="relative overflow-hidden rounded-[24px] bg-[#44318D] p-6 text-white shadow-[0_18px_42px_rgba(68,49,141,0.17)] sm:p-8">
        <span
          aria-hidden="true"
          className="absolute -right-8 -top-14 h-48 w-48 rounded-full border-[22px] border-white/[0.08]"
        />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.16em] text-white/85">
              <UsersRound size={13} />
              Administration · Directory
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              Account directory
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Search profiles, monitor account status, and take action when
              review or access changes are needed.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 sm:min-w-[150px]">
            <p className="font-nav text-[9px] uppercase tracking-[0.14em] text-white/65">
              Matching accounts
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {users ? visibleUsers.length : "—"}
            </p>
          </div>
        </div>
      </header>

      <Card className="border-[#E8E3E6] p-4 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_210px_220px]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A4B3B6]"
            />
            <Input
              aria-label="Search accounts"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search email, phone, or role"
            />
          </div>
          <Select
            aria-label="Filter users by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="">All roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="PHARMA_COMPANY">Pharma company</option>
            <option value="MR">Medical representative</option>
            <option value="PHARMACY">Pharmacy</option>
            <option value="DISTRIBUTOR_STOCKIST">Distributor / stockist</option>
            <option value="DOCTOR">Doctor</option>
          </Select>
          <Select
            aria-label="Filter users by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="PENDING_VERIFICATION">Pending verification</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </Card>

      {error && <ErrorState message={error} onRetry={load} />}

      {!users ? (
        error ? null : <Loader />
      ) : visibleUsers.length === 0 ? (
        <Card className="border-[#E8E3E6] p-8 text-center">
          <p className="font-display text-lg font-semibold text-[#2A1B3D]">
            No accounts match these filters
          </p>
          <p className="mt-2 text-sm text-[#8C8496]">
            Try a different search or clear one of the filters.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-[#E8E3E6] p-0 shadow-[0_8px_25px_rgba(42,27,61,0.035)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#EEE9EE] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-base font-semibold text-[#2A1B3D]">
                Accounts
              </h2>
              <p className="mt-1 text-xs text-[#8C8496]">
                {visibleUsers.length} result{visibleUsers.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className="rounded-full bg-[#EFEBF9] px-3 py-1 font-nav text-[9px] uppercase tracking-[0.12em] text-[#44318D]">
              Live directory
            </span>
          </div>

          <div className="divide-y divide-[#F0EDF1]">
            {visibleUsers.map((user) => (
              <article
                key={user.id}
                className="flex flex-col justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FCFAFD] sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCEAF2] font-nav text-xs font-semibold text-[#D83F87]">
                    {user.email.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold text-[#2A1B3D]">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-[#8C8496]">
                      {user.role.replaceAll("_", " ")} · {user.mobile}
                    </p>
                    <p className="mt-1 text-[11px] text-[#A4B3B6]">
                      Joined {format(new Date(user.createdAt), "d MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge status={user.status} />
                  {user.status === "PENDING_VERIFICATION" && (
                    <>
                      <Button
                        size="sm"
                        loading={busyId === user.id}
                        disabled={Boolean(busyId)}
                        onClick={() => action(user.id, "verify")}
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={Boolean(busyId)}
                        onClick={() => action(user.id, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {user.status === "ACTIVE" && user.role !== "ADMIN" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={Boolean(busyId)}
                      onClick={() => action(user.id, "suspend")}
                    >
                      Suspend
                    </Button>
                  )}
                  {user.status === "SUSPENDED" && user.role !== "ADMIN" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={Boolean(busyId)}
                      onClick={() => action(user.id, "restore")}
                    >
                      Restore access
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
