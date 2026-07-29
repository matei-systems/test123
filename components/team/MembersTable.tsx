"use client";

import { useState, useTransition } from "react";
import { updateMemberRole, removeMember, assignMemberLocation } from "@/app/dashboard/team/actions";
import { ROLE_LABEL, type Role } from "@/lib/permissions";

interface Member {
  id: string;
  role: Role;
  location_id: string | null;
  user_id: string;
  profiles: { email: string | null; full_name: string | null } | null;
}

export default function MembersTable({
  members,
  locations,
  currentUserId,
  currentUserRole,
}: {
  members: Member[];
  locations: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: Role;
}) {
  const [rows, setRows] = useState(members);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin" || isOwner;

  function changeRole(id: string, newRole: Role) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await updateMemberRole(id, newRole);
      setBusyId(null);
      if (res.error) {
        setErrorId(id);
        setError(res.error);
        return;
      }
      setRows((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
    });
  }

  function changeLocation(id: string, locationId: string | null) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await assignMemberLocation(id, locationId);
      setBusyId(null);
      if (res.error) {
        setErrorId(id);
        setError(res.error);
        return;
      }
      setRows((prev) => prev.map((m) => (m.id === id ? { ...m, location_id: locationId } : m)));
    });
  }

  function remove(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await removeMember(id);
      setBusyId(null);
      if (res.error) {
        setErrorId(id);
        setError(res.error);
        return;
      }
      setRows((prev) => prev.filter((m) => m.id !== id));
      setRemoving(null);
    });
  }

  return (
    <div className="space-y-2">
      {rows.map((m) => {
        const canChangeRole = isOwner && m.role !== "owner";
        const canRemove = m.role !== "owner" && (isOwner || (isAdmin && m.role !== "admin"));
        const canAssignLocation = isAdmin;
        const isSelf = m.user_id === currentUserId;

        return (
          <div key={m.id} className="card p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {m.profiles?.full_name || m.profiles?.email || "Unbekannt"}
                {isSelf && <span className="text-faint font-normal"> (du)</span>}
              </div>
              {m.profiles?.full_name && <div className="text-xs text-[#A6A099] truncate">{m.profiles.email}</div>}
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {canAssignLocation && locations.length > 0 && (
                <select
                  aria-label={`Standort für ${m.profiles?.full_name || m.profiles?.email || "Mitglied"}`}
                  className="input text-xs py-1.5"
                  style={{ width: "auto" }}
                  value={m.location_id ?? ""}
                  disabled={busyId === m.id}
                  onChange={(e) => changeLocation(m.id, e.target.value || null)}
                >
                  <option value="">Kein Standort</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}

              {canChangeRole ? (
                <select
                  aria-label={`Rolle für ${m.profiles?.full_name || m.profiles?.email || "Mitglied"}`}
                  className="input text-xs py-1.5"
                  style={{ width: "auto" }}
                  value={m.role}
                  disabled={busyId === m.id}
                  onChange={(e) => changeRole(m.id, e.target.value as Role)}
                >
                  <option value="staff">Mitarbeiter</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: m.role === "owner" ? "rgba(232,181,115,0.15)" : "rgba(255,255,255,0.06)",
                    color: m.role === "owner" ? "#F6D19A" : "#A6A099",
                  }}
                >
                  {ROLE_LABEL[m.role]}
                </span>
              )}

              {canRemove &&
                (removing === m.id ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => remove(m.id)}
                      className="btn text-xs"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      {busyId === m.id ? "…" : "Sicher?"}
                    </button>
                    <button type="button" onClick={() => setRemoving(null)} className="btn btn-ghost text-xs">
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setRemoving(m.id)} className="btn btn-ghost text-xs">
                    Entfernen
                  </button>
                ))}
            </div>

            {errorId === m.id && error && <div className="text-xs text-[#FCA5A5] w-full">{error}</div>}
          </div>
        );
      })}
    </div>
  );
}
