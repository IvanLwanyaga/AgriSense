import { useEffect, useState } from "react";
import FarmMap from "../components/FarmMap";
import { useAuth } from "../context/useAuth";
import { getFarms } from "../services/firestoreService";
import type { Farm } from "../types/farm";
import type { AppPage } from "../types/navigation";

export default function MapPage({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  const { user, profile } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getFarms(user?.uid, profile?.organizationId)
      .then((loadedFarms) => {
        if (!active) return;
        const ownedOrSharedFarms = loadedFarms.filter((farm) =>
          farm.farmerId === user?.uid || Boolean(profile?.organizationId && farm.organizationId === profile.organizationId)
        );
        setFarms(ownedOrSharedFarms);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.uid, profile?.organizationId]);

  return (
    <section className="workspace-page map-page">
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">Your registered farm coordinates</p>
          <h2>Farm map</h2>
          <p>Explore a live street map centered on a farm you registered. Select a different farm to move the map pin.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("farms")}>Manage farms <span>→</span></button>
      </div>

      {loading ? <div className="panel map-loading" role="status">Loading your registered farm locations…</div> : <div className="panel map-wrapper-panel"><FarmMap farms={farms} /></div>}
    </section>
  );
}
