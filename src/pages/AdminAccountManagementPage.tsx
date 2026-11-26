import { useEffect, useMemo, useState, type FormEvent } from "react";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { updateUserAccess as submitUserAccess } from "../services/adminService";
import type { UserProfile, UserRole } from "../types/user";

const ACCOUNT_ROLES: UserRole[] = [
  "FARMER",
  "AGRICULTURAL_OFFICER",
  "FARM_MANAGER",
  "ORG_ADMIN",
  "VIEWER",
  "PLATFORM_ADMIN",
];

export default function AdminAccountManagementPage() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const copy = {
    en: { heading: "Account management", kicker: "SECURE ACCESS CONTROL", description: "Only platform administrators can change account roles or active status. Privileged updates are applied by Cloud Functions.", update: "Update account access", email: "Account email", role: "Role", status: "Account status", active: "Active", inactive: "Inactive", district: "Assigned district", apply: "Apply access changes", existing: "Existing accounts", search: "Search name or email", loading: "Loading accounts?", empty: "No accounts match this search.", manage: "Manage account", denied: "Platform administrator access required" },
    lg: { heading: "Okuddukanya akawunti", kicker: "OKUKUUMA ENKOZESA", description: "Abaddukanya omukutu bokka be basobola okukyusa emirimu n'embeera ya akawunti. Enkyukakyuka ez'amaanyi zikolebwa Cloud Functions.", update: "Kyuusa olukusa lwa akawunti", email: "Email ya akawunti", role: "Omulimu", status: "Embeera ya akawunti", active: "Ekola", inactive: "Tekola", district: "Disitulikiti eyateereddwa", apply: "Teeka mu nkola enkyukakyuka", existing: "Akawunti eziriwo", search: "Noonya erinnya oba email", loading: "Akawunti ziteekebwa?", empty: "Tewali akawunti etuukana n'okunoonya kuno.", manage: "Ddukanya akawunti", denied: "Kyetaagisa olukusa lw'omuddukanya omukutu" },
    sw: { heading: "Usimamizi wa akaunti", kicker: "UDHIBITI SALAMA WA UFIKIAJI", description: "Wasimamizi wa mfumo pekee wanaweza kubadilisha majukumu au hali ya akaunti. Mabadiliko maalum hufanywa na Cloud Functions.", update: "Badilisha ufikiaji wa akaunti", email: "Barua pepe ya akaunti", role: "Jukumu", status: "Hali ya akaunti", active: "Inatumika", inactive: "Haifanyi kazi", district: "Wilaya iliyopangiwa", apply: "Tekeleza mabadiliko ya ufikiaji", existing: "Akaunti zilizopo", search: "Tafuta jina au barua pepe", loading: "Inapakia akaunti?", empty: "Hakuna akaunti inayolingana na utafutaji huu.", manage: "Dhibiti akaunti", denied: "Ufikiaji wa msimamizi wa mfumo unahitajika" },
    nyn: { heading: "Okutegyeka akawunti", kicker: "OKURINDA OKUINGIRA", description: "Abategyeki ba pulatifomu bonka nibo barikubaasa kuhindura emirimo n'embeera ya akawunti. Empindahinduka zikorebwa Cloud Functions.", update: "Hindura okuingira omu akawunti", email: "Email ya akawunti", role: "Omurimo", status: "Embeera ya akawunti", active: "Nikukora", inactive: "Tikukora", district: "Disiturikiti ei yaheirwe", apply: "Kora empindahinduka", existing: "Akawunti eziriho", search: "Zaana eiziina nari email", loading: "Akawunti nizitwarwa?", empty: "Tihariho akawunti erikuhika aha kuzaana oku.", manage: "Tegyeka akawunti", denied: "Nikwetenga obushobozi bwa mutegyeki wa pulatifomu" }
  }[language];
  const isPlatformAdmin = profile?.role === "PLATFORM_ADMIN";
  const [accounts, setAccounts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("FARMER");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [assignedDistrict, setAssignedDistrict] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!isPlatformAdmin) return;

    return onSnapshot(
      query(collection(db, "users"), limit(100)),
      (snapshot) => {
        setAccounts(snapshot.docs.map((item) => ({
          ...item.data(),
          uid: item.id,
        }) as UserProfile));
        setLoading(false);
        setError("");
      },
      (cause) => {
        console.error("Could not load account administration data.", cause);
        setError("Account records could not be loaded. Confirm your administrator access.");
        setLoading(false);
      },
    );
  }, [isPlatformAdmin]);

  const visibleAccounts = useMemo(() => {
    const search = filter.trim().toLowerCase();
    return accounts
      .filter((account) => !search
        || account.fullName.toLowerCase().includes(search)
        || account.email.toLowerCase().includes(search))
      .sort((left, right) => left.fullName.localeCompare(right.fullName));
  }, [accounts, filter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPlatformAdmin) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await submitUserAccess(email, role, status, role === "AGRICULTURAL_OFFICER" ? assignedDistrict : undefined);
      setNotice(`Updated access for ${email.trim()}.`);
    } catch (cause) {
      console.error("Administrator account update failed.", cause);
      setError(cause instanceof Error ? cause.message : "The account could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  if (!isPlatformAdmin) {
    return <section className="panel role-access-denied"><h2>{copy.denied}</h2></section>;
  }

  return (
    <section className="settings-page" style={{ maxWidth: "1080px", margin: "0 auto", padding: "24px 16px" }}>
      <header style={{ marginBottom: "24px" }}>
        <span className="section-kicker">{copy.kicker}</span>
        <h1 style={{ color: "#1b4332" }}>{copy.heading}</h1>
        <p>{copy.description}</p>
      </header>

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}

      <form className="panel" onSubmit={(event) => void handleSubmit(event)} style={{ padding: "20px", marginBottom: "24px" }}>
        <h2>{copy.update}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <label>
            {copy.email}
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            {copy.role}
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              {ACCOUNT_ROLES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label>
            {copy.status}
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="ACTIVE">{copy.active}</option>
              <option value="INACTIVE">{copy.inactive}</option>
            </select>
          </label>
          {role === "AGRICULTURAL_OFFICER" && <label>
            {copy.district}
            <input required value={assignedDistrict} onChange={(event) => setAssignedDistrict(event.target.value)} placeholder="e.g. Mukono" />
          </label>}
        </div>
        <button className="primary-button" type="submit" disabled={saving} style={{ marginTop: "16px" }}>
          {saving ? "Saving…" : "Apply access changes"}
        </button>
      </form>

      <section aria-labelledby="accounts-list-title">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "12px", flexWrap: "wrap" }}>
          <h2 id="accounts-list-title">{copy.existing}</h2>
          <label>
            {copy.search}
            <input value={filter} onChange={(event) => setFilter(event.target.value)} />
          </label>
        </div>
        {loading ? (
          <div className="panel" role="status">Loading accounts…</div>
        ) : visibleAccounts.length === 0 ? (
          <div className="panel">{copy.empty}</div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {visibleAccounts.map((account) => (
              <article key={account.uid} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", padding: "14px 18px" }}>
                <div>
                  <strong>{account.fullName}</strong>
                  <div>{account.email}</div>
                  <small>{account.role.replaceAll("_", " ")} · {account.status}</small>
                </div>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => {
                    setEmail(account.email);
                    setRole(account.role);
                    setStatus(account.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
                    setAssignedDistrict(account.assignedDistrict || "");
                  }}
                >
                  Manage account
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
