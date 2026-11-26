import { useEffect, useState } from "react";
import FarmMap from "../components/FarmMap";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { getDistrictFarms, getFarms } from "../services/firestoreService";
import type { Farm } from "../types/farm";
import type { AppPage } from "../types/navigation";

export default function MapPage({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (profile?.role === "AGRICULTURAL_OFFICER"
      ? getDistrictFarms(profile.assignedDistrict || "Mukono")
      : getFarms(user?.uid, profile?.organizationId))
      .then((loadedFarms) => {
        if (!active) return;
        const visibleFarms = profile?.role === "AGRICULTURAL_OFFICER" ? loadedFarms : loadedFarms.filter((farm) =>
          farm.farmerId === user?.uid || Boolean(profile?.organizationId && farm.organizationId === profile.organizationId)
        );
        setFarms(visibleFarms);
      })
      .catch((error: unknown) => { console.error("Could not load farm locations.", error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.uid, profile?.organizationId, profile?.role, profile?.assignedDistrict]);

  return (
    <section className="workspace-page map-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">{profile?.role === "AGRICULTURAL_OFFICER" ? `${t.mapAssignedDistrict} ? ${profile.assignedDistrict || "Mukono"}` : t.farmCoordinates}</p>
          <h2>{profile?.role === "AGRICULTURAL_OFFICER" ? t.farmLocations : t.farmMap}</h2>
          <p>{profile?.role === "AGRICULTURAL_OFFICER" ? t.reviewDistrictLocations : t.exploreFarmMap}</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("farms")}>{t.manageFarms} <span>?</span></button>
      </div>

      {loading ? <div className="panel map-loading" role="status">{t.loadingFarmLocations}</div> : <div className="panel map-wrapper-panel"><FarmMap farms={farms} /></div>}
    </section>
  );
}
