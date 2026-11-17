import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/useAuth";
import {
  addOrganizationMember,
  getOrganizationDetails,
  getOrganizationMembers,
} from "../services/organizationService";
import type { Organization, OrganizationMember } from "../types/organization";

export default function OrganizationManagementPage() {
  const { profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [reloadKey, setReloadKey] = useState(0);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberNotice, setMemberNotice] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!profile?.organizationId) {
        setOrganization(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      try {
        const org = await getOrganizationDetails(profile.organizationId);
        const mems = await getOrganizationMembers(profile.organizationId);
        if (active) {
          setOrganization(org);
          setMembers(mems);
        }
      } catch (err) {
        console.error("Failed to load organization data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [profile, reloadKey]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profile?.role !== "ORG_ADMIN") return;

    setAddingMember(true);
    setMemberError("");
    setMemberNotice("");
    try {
      await addOrganizationMember(memberEmail);
      setMemberNotice(`Added ${memberEmail.trim()} to the organization.`);
      setMemberEmail("");
      setReloadKey((current) => current + 1);
    } catch (cause) {
      console.error("Could not add organization member.", cause);
      setMemberError(cause instanceof Error ? cause.message : "The member could not be added.");
    } finally {
      setAddingMember(false);
    }
  }

  const filteredMembers = filterRole === "ALL"
    ? members
    : members.filter((m) => m.role === filterRole);

  if (loading) {
    return <div className="settings-page" style={{ padding: 32, textAlign: "center" }}>Loading Cooperative Portal...</div>;
  }

  if (!organization) {
    return (
      <div className="settings-page" style={{ maxWidth: 800, margin: "40px auto", padding: 24, textAlign: "center" }}>
        <h2>No Active Organisation Profile</h2>
        <p style={{ color: "#6b7280" }}>
          Your account is not linked to a registered cooperative or agribusiness. Upgrade your subscription to Organisation Tier to unlock multi-farmer and extension management.
        </p>
      </div>
    );
  }

  return (
    <div className="settings-page" style={{ maxWidth: "1080px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Organisation Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
        color: "#ffffff",
        borderRadius: "16px",
        padding: "28px 24px",
        marginBottom: "32px",
        boxShadow: "0 10px 25px rgba(27, 67, 50, 0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{
              display: "inline-block",
              background: "#d8f3dc",
              color: "#1b4332",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              padding: "4px 10px",
              borderRadius: "12px",
              marginBottom: "8px",
            }}>
              Cooperative & Organisation Portal
            </span>
            <h1 style={{ margin: "0 0 6px 0", fontSize: "26px", fontWeight: 800 }}>
              {organization.name}
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#d8f3dc" }}>
              Reg: {organization.registrationNumber} · {organization.district} District ({organization.subCounties.join(", ")})
            </p>
          </div>

          <div style={{ textAlign: "right", minWidth: "140px" }}>
            <div style={{ fontSize: "12px", color: "#d8f3dc", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Capacity Quota
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff" }}>
              {organization.totalFarmers} <span style={{ fontSize: "16px", fontWeight: 500, color: "#d8f3dc" }}>/ {organization.maxFarmers}</span>
            </div>
            <div style={{ fontSize: "12px", color: "#b7e4c7" }}>Enrolled Smallholders</div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginTop: "24px",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          paddingTop: "20px",
        }}>
          <div>
            <div style={{ fontSize: "12px", color: "#d8f3dc" }}>Monitored Plots</div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{organization.totalFarms} Farms</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#d8f3dc" }}>Coverage Area</div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>482.4 Hectares</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#d8f3dc" }}>Assigned Extension Staff</div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>
              {members.filter((m) => m.role === "AGRICULTURAL_OFFICER").length || 1} Officers
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#d8f3dc" }}>Status</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#95d5b2" }}>✓ ACTIVE</div>
          </div>
        </div>
      </div>

      {profile?.role === "ORG_ADMIN" && (
        <form
          className="panel"
          onSubmit={(event) => void handleAddMember(event)}
          style={{ padding: "20px", marginBottom: "24px" }}
        >
          <h2>Add an existing member</h2>
          <p>Enter the email of an active, verified AgriSense farmer or an approved extension officer. This links the account to your organization without changing its role.</p>
          {memberError && <p className="form-error" role="alert">{memberError}</p>}
          {memberNotice && <p className="form-success" role="status">{memberNotice}</p>}
          <label>
            Member email
            <input
              type="email"
              required
              value={memberEmail}
              onChange={(event) => setMemberEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          <button className="primary-button" type="submit" disabled={addingMember} style={{ marginTop: "12px" }}>
            {addingMember ? "Adding…" : "Add verified member"}
          </button>
        </form>
      )}

      {/* Roster & Member Management */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "24px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#111827" }}>
              Enrolled Members & Extension Staff
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              Participating smallholders, farm managers, and designated extension officers.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
              }}
            >
              <option value="ALL">All Roles ({members.length})</option>
              <option value="FARMER">Farmers</option>
              <option value="AGRICULTURAL_OFFICER">Extension Officers</option>
              <option value="ORG_ADMIN">Administrators</option>
            </select>
          </div>
        </div>

        {/* Member Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6", textAlign: "left", color: "#6b7280" }}>
                <th style={{ padding: "10px 12px" }}>Name</th>
                <th style={{ padding: "10px 12px" }}>Role</th>
                <th style={{ padding: "10px 12px" }}>Location</th>
                <th style={{ padding: "10px 12px" }}>Contact</th>
                <th style={{ padding: "10px 12px" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.uid} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "#111827" }}>
                    {member.fullName}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: member.role === "AGRICULTURAL_OFFICER" ? "#e0f2fe" : "#f0fdf4",
                      color: member.role === "AGRICULTURAL_OFFICER" ? "#0369a1" : "#166534",
                    }}>
                      {member.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "#4b5563" }}>
                    {member.assignedDistrict || "Mukono"}{member.assignedSubCounty ? ` · ${member.assignedSubCounty}` : ""}
                  </td>
                  <td style={{ padding: "12px", color: "#4b5563" }}>
                    {member.phone || member.email}
                  </td>
                  <td style={{ padding: "12px", color: "#9ca3af" }}>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
