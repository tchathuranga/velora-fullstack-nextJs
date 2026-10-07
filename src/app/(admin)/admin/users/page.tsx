"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search, Trash2, UserPlus, X } from "lucide-react";
import {
  getErrorMessage,
  useCreateAdminUserMutation,
  useDeleteUserMutation,
  useGetAdminUsersQuery,
} from "@/Redux/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import type { AdminUser, AdminUserRole, BuyerStatus } from "@/types";

type RoleFilter = AdminUserRole | "all";
type StatusFilter = BuyerStatus | "all";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admins" },
  { value: "seller", label: "Sellers" },
  { value: "buyer", label: "Buyers" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "limited", label: "Limited" },
];

const ROLE_BADGE: Record<AdminUserRole, string> = {
  admin: "bg-slate-900 text-white",
  seller: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  buyer: "bg-[var(--color-surface-muted)] text-slate-700",
};

export default function AdminUsersPage() {
  const { username: currentUsername } = useAuth();
  const { data: users = [], isLoading } = useGetAdminUsersQuery();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (role === "all" || u.role === role) &&
        (status === "all" || u.status === status) &&
        (!q || [u.name, u.username, u.email].some((v) => v.toLowerCase().includes(q))),
    );
  }, [users, search, role, status]);

  const hasFilters = search !== "" || role !== "all" || status !== "all";
  const isSelf = (u: AdminUser) => u.username.toLowerCase() === currentUsername?.toLowerCase();

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteUser(pendingDelete.id)
      .unwrap()
      .then(() => setError(""))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setPendingDelete(null));
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            All registered accounts: admins, sellers and buyers. Guest checkouts are not listed.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus size={16} /> Create admin
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username or email"
            className="input-base pl-9"
            aria-label="Search users"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as RoleFilter)}
          className="input-base !w-auto"
          aria-label="Filter by role"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="input-base !w-auto"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setRole("all");
              setStatus("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <p className="mt-3 text-xs text-[var(--color-muted)]">
        Showing {filtered.length} of {users.length} users
      </p>

      <div className="card mt-2 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-3 text-slate-700">{u.username}</td>
                <td className="px-4 py-3 text-slate-700">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium capitalize", ROLE_BADGE[u.role])}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      u.status === "active"
                        ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                        : "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
                    )}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isSelf(u)}
                    title={isSelf(u) ? "You can't delete your own account" : undefined}
                    onClick={() => setPendingDelete(u)}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted)]">
                  {hasFilters ? "No users match your search or filters." : "No users yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateAdminDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setError("");
          }}
        />
      )}

      {pendingDelete && (
        <Dialog title="Delete user" onClose={() => !deleting && setPendingDelete(null)}>
          <p className="text-sm text-slate-700">
            Permanently delete <strong>{pendingDelete.name}</strong> ({pendingDelete.email})?
            {pendingDelete.role === "seller" && " Their store and all of its products will be deleted too."}
            {" "}This can&apos;t be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete user"}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function CreateAdminDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [createAdmin, { isLoading }] = useCreateAdminUserMutation();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdmin(form)
      .unwrap()
      .then(onCreated)
      .catch((err) => setError(getErrorMessage(err)));
  };

  return (
    <Dialog title="Create admin user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Full name">
          <input className="input-base" value={form.name} onChange={set("name")} required autoFocus />
        </Field>
        <Field label="Username">
          <input className="input-base" value={form.username} onChange={set("username")} required autoComplete="off" />
        </Field>
        <Field label="Email">
          <input className="input-base" type="email" value={form.email} onChange={set("email")} required />
        </Field>
        <Field label="Password">
          <input
            className="input-base"
            type="password"
            value={form.password}
            onChange={set("password")}
            minLength={6}
            required
            autoComplete="new-password"
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating…" : "Create admin"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
