import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import { reviewOfficerApplication as submitOfficerReview } from "../services/adminService";

interface OfficerApplication {
  id: string;
  uid?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  assignedDistrict?: string;
  assignedSubCounty?: string;
  organizationName?: string;
  staffId?: string;
  status?: string;
  applicationStatus?: string;
  requestedRole?: string;
}

export default function StaffApplicationsPage() {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<OfficerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [notice, setNotice] = useState("");
  const isAdmin = profile?.role === "PLATFORM_ADMIN";

  useEffect(() => {
    if (!user || !isAdmin) {
      setApplications([]);
      setLoading(false);
      return;
    }
    return onSnapshot(
      query(collection(db, "staffApplications"), where("status", "==", "PENDING")),
      (snapshot) => {
        const pending = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as OfficerApplication)
          .sort((a, b) => (a.assignedDistrict || "").localeCompare(b.assignedDistrict || ""));
        setApplications(pending);
        setLoading(false);
        setError("");
      },
      (cause) => {
        console.error("Could not load officer applications:", cause);
        setError("Could not load applications. Confirm you are signed in as a platform administrator.");
        setLoading(false);
      },
    );
  }, [user, isAdmin]);

  async function reviewApplication(application: OfficerApplication, approve: boolean) {
    if (!user || !isAdmin || workingId) return;
    setWorkingId(application.id);
    setError("");
    setNotice("");
    try {
      await submitOfficerReview(application.id, approve ? "APPROVE" : "REJECT");
      setNotice(`${application.fullName || "Applicant"} ${approve ? "approved as an extension officer" : "declined"}.`);
    } catch (cause) {
      console.error("Could not review officer application:", cause);
      setError("The application could not be updated. Check administrator permissions and try again.");
    } finally {
      setWorkingId("");
    }
  }

  if (!isAdmin) {
    return <section className="panel role-access-denied"><h2>Administrator access required</h2><p>Only platform administrators can approve officer privileges.</p></section>;
  }

  return (
    <section className="staff-applications-page">
      <header className="staff-applications-hero panel">
        <div><span className="section-kicker">TEAM ACCESS</span><h2>Extension officer applications</h2><p>Verify each applicant’s work details before granting access to farmer referrals and district casework.</p></div>
        <span className="staff-applications-count">{applications.length} pending</span>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
      {loading ? <section className="panel staff-applications-empty">Loading applications…</section> : applications.length === 0 ? (
        <section className="panel staff-applications-empty"><span aria-hidden="true">✓</span><h3>All caught up</h3><p>There are no officer applications waiting for review.</p></section>
      ) : (
        <div className="staff-applications-list">{applications.map((application) => (
          <article className="panel staff-application-card" key={application.id}>
            <div className="staff-application-heading"><div className="staff-applicant-avatar">{(application.fullName || "?").slice(0, 1).toUpperCase()}</div><div><h3>{application.fullName || "Unnamed applicant"}</h3><p>{application.organizationName || "Organization not provided"}</p></div><span className="staff-pending-badge">Needs review</span></div>
            <dl className="staff-application-details">
              <div><dt>Work ID</dt><dd>{application.staffId || "Not provided"}</dd></div>
              <div><dt>District</dt><dd>{application.assignedDistrict || "Not provided"}</dd></div>
              <div><dt>Sub-county</dt><dd>{application.assignedSubCounty || "Not provided"}</dd></div>
              <div><dt>Contact</dt><dd>{application.phone || application.email || "Not provided"}</dd></div>
            </dl>
            <footer className="staff-application-actions"><button type="button" className="outline-button" onClick={() => void reviewApplication(application, false)} disabled={Boolean(workingId)}>Decline</button><button type="button" className="primary-button" onClick={() => void reviewApplication(application, true)} disabled={Boolean(workingId)}>{workingId === application.id ? "Saving…" : "Approve officer access"}</button></footer>
          </article>
        ))}</div>
      )}
    </section>
  );
}
