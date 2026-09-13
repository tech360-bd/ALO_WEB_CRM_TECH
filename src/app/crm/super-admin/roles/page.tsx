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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading RBAC matrix...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-[#0066CC]" />
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-gray-500 mt-2">Manage enterprise roles, permissions, and acting-as capabilities.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-900 font-semibold">
              <tr>
                <th className="px-6 py-4">Permission / Module</th>
                {permissionsData?.dbRoles?.map((role: any) => (
                  <th key={role.id} className="px-6 py-4 text-center border-l border-gray-200 min-w-[150px]">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-bold">{role.label}</span>
                      <span className="text-xs text-gray-500 font-normal mt-1">{role.isSystem ? 'System' : 'Custom'}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permissionsData?.permissions?.map((perm: any) => (
                <tr key={perm.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{perm.feature} : {perm.action}</div>
                    <div className="text-xs text-gray-500 mt-1">{perm.description}</div>
                  </td>
                  {permissionsData?.dbRoles?.map((role: any) => {
                    const isGranted = perm[role.name];
                    return (
                      <td key={role.id} className="px-6 py-4 text-center border-l border-gray-200">
                        <button
                          onClick={() => handleTogglePermission(role.id, perm.id, isGranted)}
                          disabled={role.isSystem}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            isGranted
                              ? "bg-[#0066CC]/10 text-[#0066CC] hover:bg-[#0066CC]/20"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
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
