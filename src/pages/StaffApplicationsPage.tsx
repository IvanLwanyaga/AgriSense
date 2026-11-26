import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
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
  const { language } = useLanguage();
  const c = {
    en: { denied: "Administrator access required", deniedHelp: "Only platform administrators can approve officer privileges.", kicker: "TEAM ACCESS", title: "Extension officer applications", intro: "Verify each applicantâ€™s work details before granting access to farmer referrals and district casework.", pending: "pending", loading: "Loading applicationsâ€¦", caughtUp: "All caught up", none: "There are no officer applications waiting for review.", unnamed: "Unnamed applicant", noOrg: "Organization not provided", needsReview: "Needs review", workId: "Work ID", district: "District", subCounty: "Sub-county", contact: "Contact", notProvided: "Not provided", decline: "Decline", saving: "Savingâ€¦", approve: "Approve officer access" },
    lg: { denied: "Kyetaagisa olukusa lw'omuddukanya", deniedHelp: "Abaddukanya omukutu bokka be basobola kukkiriza abakugu okukola.", kicker: "OKUYINGIZA ABAKOZI", title: "Okusaba kw'abakugu b'ebyobulimi", intro: "Kebera omulimu n'ebiwandiiko by'omusaba nga tonnamuwa lukusa lwa mirimu gy'abalimi n'emisango gya disitulikiti.", pending: "birindiridde", loading: "Okusaba kuteekebwaâ€¦", caughtUp: "Tewali kusaba kulindiridde", none: "Tewali kusaba kw'abakugu kulindiridde kukeberwa.", unnamed: "Omusaba atalina linnya", noOrg: "Ekibiina tekiteereddwa", needsReview: "Kyetaaga okukeberwa", workId: "Namba y'omukozi", district: "Disitulikiti", subCounty: "Gombolola", contact: "Endagiriro", notProvided: "Titeereddwa", decline: "Gaana", saving: "Biterekebwaâ€¦", approve: "Kkiriza omukugu okukola" },
    sw: { denied: "Ufikiaji wa msimamizi unahitajika", deniedHelp: "Wasimamizi wa mfumo pekee wanaweza kuidhinisha ruhusa za maafisa.", kicker: "UFIKIAJI WA TIMU", title: "Maombi ya maafisa ugani", intro: "Thibitisha maelezo ya kazi ya mwombaji kabla ya kumpa ufikiaji wa rufaa za wakulima na kesi za wilaya.", pending: "yanasubiri", loading: "Inapakia maombiâ€¦", caughtUp: "Yote yamekaguliwa", none: "Hakuna maombi ya afisa yanayosubiri ukaguzi.", unnamed: "Mwombaji asiye na jina", noOrg: "Shirika halijatolewa", needsReview: "Yanahitaji ukaguzi", workId: "Nambari ya kazi", district: "Wilaya", subCounty: "Kaunti ndogo", contact: "Mawasiliano", notProvided: "Haijatolewa", decline: "Kataa", saving: "Inahifadhiâ€¦", approve: "Idhinisha ufikiaji wa afisa" },
    nyn: { denied: "Nikwetenga obushobozi bwa mutegyeki", deniedHelp: "Abategyeki ba pulatifomu bonka nibo barikubaasa kwikiriza emirimo y'abahabuzi.", kicker: "OKUINGIZA ABAKOZI", title: "Okushaba kw'abahabuzi b'eby'obuhingi", intro: "Hamya emirimo y'omushabi otakamuha obushobozi bw'okureeba abariimi n'emishango ya disiturikiti.", pending: "ebitegereize", loading: "Okushaba nikutwarwaâ€¦", caughtUp: "Byona bihweire", none: "Tihariho kushaba kw'omuhabuzi okute gereize kureebwa.", unnamed: "Omushabi ataine eiziina", noOrg: "Ekibiina tikigambirwe", needsReview: "Nikwetenga kureebwa", workId: "Namba y'omukozi", district: "Disiturikiti", subCounty: "Gomborora", contact: "Obuhwezi", notProvided: "Tikirahairwe", decline: "Yanga", saving: "Nibibikwaâ€¦", approve: "Ikiriza omuhabuzi kukora" }
  }[language];
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
    return <section className="panel role-access-denied"><h2>{c.denied}</h2><p>{c.deniedHelp}</p></section>;
  }

  return (
    <section className="staff-applications-page">
      <header className="staff-applications-hero panel">
        <div><span className="section-kicker">TEAM ACCESS</span><h2>Extension officer applications</h2><p>Verify each applicantâ€™s work details before granting access to farmer referrals and district casework.</p></div>
        <span className="staff-applications-count">{applications.length} {c.pending}</span>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
      {loading ? <section className="panel staff-applications-empty">Loading applicationsâ€¦</section> : applications.length === 0 ? (
        <section className="panel staff-applications-empty"><span aria-hidden="true">âœ“</span><h3>{c.caughtUp}</h3><p>{c.none}</p></section>
      ) : (
        <div className="staff-applications-list">{applications.map((application) => (
          <article className="panel staff-application-card" key={application.id}>
            <div className="staff-application-heading"><div className="staff-applicant-avatar">{(application.fullName || "?").slice(0, 1).toUpperCase()}</div><div><h3>{application.fullName || c.unnamed}</h3><p>{application.organizationName || c.noOrg}</p></div><span className="staff-pending-badge">{c.needsReview}</span></div>
            <dl className="staff-application-details">
              <div><dt>{c.workId}</dt><dd>{application.staffId || c.notProvided}</dd></div>
              <div><dt>{c.district}</dt><dd>{application.assignedDistrict || c.notProvided}</dd></div>
              <div><dt>{c.subCounty}</dt><dd>{application.assignedSubCounty || c.notProvided}</dd></div>
              <div><dt>{c.contact}</dt><dd>{application.phone || application.email || c.notProvided}</dd></div>
            </dl>
            <footer className="staff-application-actions"><button type="button" className="outline-button" onClick={() => void reviewApplication(application, false)} disabled={Boolean(workingId)}>{c.decline}</button><button type="button" className="primary-button" onClick={() => void reviewApplication(application, true)} disabled={Boolean(workingId)}>{workingId === application.id ? "Savingâ€¦" : "Approve officer access"}</button></footer>
          </article>
        ))}</div>
      )}
    </section>
  );
}
