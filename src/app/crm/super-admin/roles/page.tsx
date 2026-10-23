"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, X, Shield, Lock, Users, AlertCircle } from "lucide-react";

export default function RolesManagementPage() {
  const [permissionsData, setPermissionsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/permissions");
      const json = await res.json();
      if (json.success) {
        setPermissionsData(json.data);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError("Failed to fetch permissions data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleTogglePermission = async (roleId: string, permissionId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/permissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roleId,
          permissionId,
          granted: !currentStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchPermissions(); // Refresh
      } else {
        alert("Error: " + json.error);
      }
    } catch (error) {
      alert("Failed to update permission");
    }
  };

  if (loading) return <div className="p-8 text-center text-[var(--alo-text-muted)]">Loading RBAC matrix...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--alo-text)] flex items-center gap-2">
            <Shield className="w-8 h-8 text-[var(--alo-brand)]" />
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-[var(--alo-text-muted)] mt-2">Manage enterprise roles, permissions, and acting-as capabilities.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-[var(--alo-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--alo-body)]">
            <thead className="bg-[var(--alo-page)] border-b border-[var(--alo-border)] text-[var(--alo-text)] font-semibold">
              <tr>
                <th className="px-6 py-4">Permission / Module</th>
                {permissionsData?.dbRoles?.map((role: any) => (
                  <th key={role.id} className="px-6 py-4 text-center border-l border-[var(--alo-border)] min-w-[150px]">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-bold">{role.label}</span>
                      <span className="text-xs text-[var(--alo-text-muted)] font-normal mt-1">{role.isSystem ? 'System' : 'Custom'}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--alo-border)]">
              {permissionsData?.permissions?.map((perm: any) => (
                <tr key={perm.id} className="hover:bg-[var(--alo-page)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--alo-text)]">{perm.feature} : {perm.action}</div>
                    <div className="text-xs text-[var(--alo-text-muted)] mt-1">{perm.description}</div>
                  </td>
                  {permissionsData?.dbRoles?.map((role: any) => {
                    const isGranted = perm[role.name];
                    return (
                      <td key={role.id} className="px-6 py-4 text-center border-l border-[var(--alo-border)]">
                        <button
                          onClick={() => handleTogglePermission(role.id, perm.id, isGranted)}
                          disabled={role.isSystem}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            isGranted
                              ? "bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] hover:bg-[var(--alo-brand)]/20"
                              : "bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)] hover:bg-gray-200"
                          } ${role.isSystem ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          title={role.isSystem ? "System roles cannot be modified" : "Click to toggle"}
                        >
                          {isGranted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
