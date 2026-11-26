import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { getLocalAssessmentHistory } from "../services/bctbAssessmentService";
import { getActivities } from "../services/activityService";
import { getFarms, saveFarmBoundary } from "../services/firestoreService";
import type { Farm, FarmBoundaryPoint } from "../types/farm";

function polygonAreaHectares(points: FarmBoundaryPoint[]): number {
  const earthRadiusMeters = 6_371_000;
  const meanLatitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const projected = points.map((point) => ({
    x: earthRadiusMeters * point.longitude * Math.PI / 180 * Math.cos(meanLatitude * Math.PI / 180),
    y: earthRadiusMeters * point.latitude * Math.PI / 180,
  }));
  let twiceArea = 0;
  for (let index = 0; index < projected.length; index += 1) {
    const current = projected[index];
    const next = projected[(index + 1) % projected.length];
    twiceArea += current.x * next.y - next.x * current.y;
  }
  return Math.abs(twiceArea) / 2 / 10_000;
}

function validatePoint(latitude: number, longitude: number): string {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return "Latitude must be between -90 and 90.";
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return "Longitude must be between -180 and 180.";
  return "";
}

function boundaryPreviewPoints(points: FarmBoundaryPoint[]): string {
  if (points.length < 3) return "";
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latSpan = maxLat - minLat || 0.00001;
  const lonSpan = maxLon - minLon || 0.00001;
  return points.map((point, index) => {
    const x = 20 + (point.longitude - minLon) / lonSpan * 260;
    const y = 160 - (point.latitude - minLat) / latSpan * 120;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

export default function CoffeePassportPage() {
  const { language } = useLanguage();
  const c = {
    en: { traceability: "Farm traceability record", title: "Coffee Passport", intro: "Record a farm boundary and create a printable, owner-entered traceability snapshot.", print: "Print / Save PDF", disclaimer: "Draft record â€” not an EUDR certificate.", disclaimerText: "GPS points, acreage and scouting records are not independently verified. A QR checksum detects changes to the encoded snapshot; it is not an issuer signature, deforestation assessment, or public verification service.", loading: "Loading registered farmsâ€¦", register: "Register a farm first", linked: "A Coffee Passport is tied to a registered farm record.", farm: "Farm", boundary: "Map the farm boundary", boundaryHelp: "Walk the perimeter and capture each corner in order, or enter GPS coordinates. Minimum three points; the boundary closes automatically.", capture: "Capture next boundary point", points: "points recorded", addPoint: "Add point", remove: "Remove", area: "Calculated area", needThree: "Add at least 3 points", save: "Save boundary", saving: "Savingâ€¦", ownerOnly: "This farm is visible to your organization, but only its registered owner can record a boundary.", snapshot: "Coffee Farm Traceability Snapshot", draft: "OWNER-ENTERED DRAFT", details: "Recorded traceability evidence", records: "BCTB screening record(s) available on this device for this farm.", notDiagnosis: "screening only â€” not a confirmed diagnosis.", spray: "No spray activity recorded is not proof that prohibited inputs were never used; entries are farmer-reported.", generate: "Generate local QR snapshot", notCertificate: "Not a land-title document, accredited boundary survey, no-deforestation finding, export due-diligence statement, or EUDR certificate." },
    lg: { traceability: "Ebiwandiiko ebiraga ensibuko y'omulimi", title: "Paspooti ya Kaawa", intro: "Wandiika ensalo y'omulimi okole ekifaananyi eky'ensibuko ekiyinza okukubibwa.", print: "Kuba / Tereka PDF", disclaimer: "Ebiwandiiko eby'okugezesa â€” si satifikeeti ya EUDR.", disclaimerText: "Obubonero bwa GPS, obunene bw'ettaka n'eby'okukebera tebikakasiddwa muntu mulala. QR checksum eraga enkyukakyuka mu bifaananyi; si mukono gwa mukakasa oba okukebera okutongole.", loading: "Emirima egiteereddwa giteekebwaâ€¦", register: "Sooka oteekewo omulimi", linked: "Paspooti ya Kaawa ekwatagana n'ebiweebwayo by'omulimi.", farm: "Omulimi", boundary: "Kola maapu y'ensalo y'omulimi", boundaryHelp: "Tambula ku nsalo okube obubonero bw'enkoona mu nsengeka, oba oyingize obubonero bwa GPS. Kyetaagisa obubonero busatu; ensalo eggalibwa yokka.", capture: "Kuba akabonero k'ensalo akaddako", points: "obubonero buwandiikiddwa", addPoint: "Yongerako akabonero", remove: "Ggyawo", area: "Obunene obubaliriddwa", needThree: "Yongerako obubonero busatu", save: "Tereka ensalo", saving: "Biterekebwaâ€¦", ownerOnly: "Omulimi guno gulabika eri ekibiina kyo naye nannyini gwo yekka y'akkirizibwa okuwandiika ensalo.", snapshot: "Ebiwandiiko by'ensibuko y'omulimi wa kaawa", draft: "EBIWANDIIKO BY'OMULIMI", details: "Obujulizi bw'ensibuko obuwandiikiddwa", records: "Ebiwandiiko by'okukebera BCTB ebiri ku kyuma kino ku mulimi guno.", notDiagnosis: "kukebera kwokka â€” si kukakasa ndwadde.", spray: "Obutaba na kuwandiika kufuuyira tekikakasa nti tewaakozesebwa ddagala eritakkirizibwa; omulimi y'awadde amawulire gano.", generate: "Kola ekifaananyi kya QR eky'omu kyuma", notCertificate: "Si biwandiiko bya ttaka, kupima nsalo kwa mutongole, kukakasa obutaba na kusanyaawo bibira oba satifikeeti ya EUDR." },
    sw: { traceability: "Rekodi ya ufuatiliaji wa shamba", title: "Pasipoti ya Kahawa", intro: "Rekodi mpaka za shamba na uunde muhtasari wa ufuatiliaji unaoweza kuchapishwa.", print: "Chapisha / Hifadhi PDF", disclaimer: "Rekodi ya rasimu â€” si cheti cha EUDR.", disclaimerText: "Viambatisho vya GPS, eneo na ukaguzi havijathibitishwa kwa kujitegemea. Alama ya QR huonyesha mabadiliko ya muhtasari; si sahihi ya mtoaji au uthibitisho rasmi.", loading: "Inapakia mashamba yaliyosajiliwaâ€¦", register: "Sajili shamba kwanza", linked: "Pasipoti ya kahawa imeunganishwa na rekodi ya shamba lililosajiliwa.", farm: "Shamba", boundary: "Ramani ya mpaka wa shamba", boundaryHelp: "Tembea kwenye mpaka na uweke kila kona kwa mpangilio, au ingiza viambatisho vya GPS. Angalau pointi tatu; mpaka utafungwa kiotomatiki.", capture: "Pata pointi inayofuata ya mpaka", points: "pointi zimerekodiwa", addPoint: "Ongeza pointi", remove: "Ondoa", area: "Eneo lililokadiriwa", needThree: "Ongeza angalau pointi 3", save: "Hifadhi mpaka", saving: "Inahifadhiâ€¦", ownerOnly: "Shamba hili linaonekana kwa chama chako, lakini mmiliki aliyesajiliwa pekee ndiye anayeweza kurekodi mpaka.", snapshot: "Muhtasari wa ufuatiliaji wa shamba la kahawa", draft: "RASIMU ILIYOJAZWA NA MMILIKI", details: "Ushahidi wa ufuatiliaji uliorekodiwa", records: "Rekodi za uchunguzi wa BCTB zinazopatikana kwenye kifaa hiki kwa shamba hili.", notDiagnosis: "uchunguzi pekee â€” si utambuzi uliothibitishwa.", spray: "Kutorekodi kunyunyizia hakuthibitishi kuwa kemikali zilizopigwa marufuku hazikutumika; taarifa zimetolewa na mkulima.", generate: "Tengeneza muhtasari wa QR wa ndani", notCertificate: "Si hati ya umiliki wa ardhi, upimaji rasmi wa mpaka, uthibitisho wa kutokata misitu, tamko la mauzo nje, wala cheti cha EUDR." },
    nyn: { traceability: "Ebiwandiiko by'ensibuko y'omusiri", title: "Paspooti ya Kaawa", intro: "Handiika ensalo y'omusiri kandi okole ebiwandiiko by'ensibuko ebirikubaasa kukubibwa.", print: "Kuba / Bika PDF", disclaimer: "Ebiwandiiko by'okugezesa â€” ti satifikeeti ya EUDR.", disclaimerText: "Ebipimo bya GPS, obugazi bw'itaka n'okurondoola tibihamiziibwe omuntu ondi. QR checksum neeyoreka empindahinduka; ti mukono gw'omuhamya nari okureeba okurikukorwa omu butongore.", loading: "Emisiri ebikire neetwarwaâ€¦", register: "Sooka obike omusiri", linked: "Paspooti ya kaawa ekwatirwe aha biwandiiko by'omusiri ebikire.", farm: "Omusiri", boundary: "Kora maapu y'ensalo y'omusiri", boundaryHelp: "Gyendera aha nsalo kandi otere obumanyiso aha nkoona omu nsengeka, nari ohingire ebipimo bya GPS. Obumanyiso busatu nibwetengyesa; ensalo neeyegarura yonka.", capture: "Kwata akapimo k'ensalo akarikukurataho", points: "ebipimo bihandiikirwe", addPoint: "Yongeraho akapimo", remove: "Gyamu", area: "Obugazi obubarirwe", needThree: "Yongeraho ebipimo bishatu", save: "Bika ensalo", saving: "Nibibikwaâ€¦", ownerOnly: "Omusiri ogu nigurebeka ekibiina kyawe, kwonka nyini gwenka niwe arikubaasa kuhandiika ensalo.", snapshot: "Ebiwandiiko by'ensibuko y'omusiri gwa kaawa", draft: "EBIWANDIIKO BY'OMWENI WA MUSIRI", details: "Obujurizi bw'ensibuko obuhandiikirwe", records: "Ebiwandiiko by'okukebera BCTB ebiri aha kyuma eki aha musiri ogu.", notDiagnosis: "kukebera kwonka â€” ti kugumizamu okuhamya.", spray: "Obutaba na kiwandiiko ky'okufuuyira tikirikumanyisa ngu ebintu ebizibire tibikozirwe; amakuru gahaire omuriimi.", generate: "Kora QR snapshot y'aha kyuma", notCertificate: "Ti raarirano y'itaka, okupima ensalo okw'obutongore, okureeba obutashenyemu bishaka nari satifikeeti ya EUDR." }
  }[language];
  const { user, profile } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [boundaryDraft, setBoundaryDraft] = useState<{ farmId: string; points: FarmBoundaryPoint[] } | null>(null);
  const [boundaryError, setBoundaryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [qrSnapshot, setQrSnapshot] = useState<{ farmId: string; dataUrl: string; hash: string } | null>(null);
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    let active = true;
    getFarms(user?.uid, profile?.organizationId).then((loaded) => {
      if (!active) return;
      setFarms(loaded);
      setFarmId(loaded[0]?.id || "");
    }).catch((error: unknown) => {
      if (active) setPageError(error instanceof Error ? error.message : "Farm records could not be loaded.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user?.uid, profile?.organizationId]);

  const farm = farms.find((item) => item.id === farmId) || null;
  const isOwner = Boolean(farm && user?.uid === farm.farmerId);
  const points = farm && boundaryDraft?.farmId === farm.id ? boundaryDraft.points : farm?.boundary || [];
  const screenings = farm ? getLocalAssessmentHistory().filter((item) => item.farmId === farm.id) : [];
  const activities = farm ? getActivities(farm.id) : [];
  const qrDataUrl = farm && qrSnapshot?.farmId === farm.id ? qrSnapshot.dataUrl : "";
  const snapshotHash = farm && qrSnapshot?.farmId === farm.id ? qrSnapshot.hash : "";
  const boundary = points;
  const boundaryArea = boundary.length >= 3 ? polygonAreaHectares(boundary) : 0;
  const isBoundarySaved = Boolean(farm?.boundary && points.length === farm.boundary.length
    && points.every((point, index) => point.latitude === farm.boundary?.[index]?.latitude
      && point.longitude === farm.boundary?.[index]?.longitude));
  const previewPath = boundaryPreviewPoints(boundary);

  function addPoint(point: FarmBoundaryPoint) {
    setBoundaryError("");
    if (farm) setBoundaryDraft({ farmId: farm.id, points: [...points, point] });
    setLatitude("");
    setLongitude("");
    setQrSnapshot(null);
  }

  function setPoints(nextPoints: FarmBoundaryPoint[]) {
    if (farm) setBoundaryDraft({ farmId: farm.id, points: nextPoints });
  }

  function captureBoundaryPoint() {
    if (!navigator.geolocation) {
      setBoundaryError("This browser does not support GPS. Enter the point coordinates manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => addPoint({
        latitude: Number(position.coords.latitude.toFixed(7)),
        longitude: Number(position.coords.longitude.toFixed(7)),
      }),
      (error) => {
        console.warn("Boundary GPS capture failed.", error);
        setBoundaryError("Could not capture this GPS point. Check location permission and try again.");
      },
      { enableHighAccuracy: true, timeout: 20_000 }
    );
  }

  function addManualPoint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPoint = { latitude: Number(latitude), longitude: Number(longitude) };
    const error = validatePoint(nextPoint.latitude, nextPoint.longitude);
    if (error) {
      setBoundaryError(error);
      return;
    }
    addPoint(nextPoint);
  }

  async function handleSaveBoundary() {
    if (!farm) return;
    if (points.length < 3) {
      setBoundaryError("Record at least three boundary points before saving.");
      return;
    }
    setSaving(true);
    setBoundaryError("");
    try {
      await saveFarmBoundary(farm, points, boundaryArea);
      setFarms((current) => current.map((item) => item.id === farm.id
        ? {
            ...item,
            boundary: points,
            boundaryAreaHectares: boundaryArea,
            passportAudit: [
              ...(item.passportAudit || []),
              {
                action: "BOUNDARY_RECORDED",
                actorUid: user?.uid || "",
                recordedAt: new Date().toISOString(),
                pointCount: points.length,
                areaHectares: boundaryArea,
                source: "GPS_OR_MANUAL",
              },
            ],
          }
        : item));
    } catch (error) {
      setBoundaryError(error instanceof Error ? error.message : "The farm boundary could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function createPassportQr() {
    if (!farm?.boundary?.length || !isBoundarySaved) return;
    setQrError("");
    try {
      const payload = {
        type: "AgriSense Coffee Passport snapshot",
        version: 1,
        farmId: farm.id,
        farmName: farm.name,
        district: farm.district,
        subCounty: farm.subCounty || null,
        center: farm.location,
        coffeeVariety: farm.coffeeVariety || "not recorded",
        boundary: farm.boundary,
        boundaryAreaHectares: farm.boundaryAreaHectares,
        screeningEvidence: screenings.slice(0, 5).map((screening) => ({
          risk: screening.riskLevel,
          recordedAt: screening.createdAt,
          status: "screening-not-diagnosis",
        })),
        activityEvidence: activities.slice(0, 5).map((activity) => ({
          type: activity.activityType,
          date: activity.date,
          title: activity.title,
        })),
        capturedAt: new Date().toISOString(),
        verificationNote: "Owner-entered snapshot; no independent survey, deforestation, or EUDR validation is asserted.",
      };
      const canonicalPayload = JSON.stringify(payload);
      if (new TextEncoder().encode(canonicalPayload).byteLength > 2_500) {
        throw new Error("This boundary and evidence exceed the printable QR capacity. Record fewer boundary points or generate a PDF without a QR.");
      }
      if (!globalThis.crypto?.subtle) throw new Error("Secure browser hashing is unavailable; QR was not generated.");
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalPayload));
      const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const qrData = JSON.stringify({ ...payload, sha256: hash });
      setQrSnapshot({
        farmId: farm.id,
        dataUrl: await QRCode.toDataURL(qrData, { errorCorrectionLevel: "M", margin: 2, width: 240 }),
        hash,
      });
    } catch (error) {
      setQrError(error instanceof Error ? error.message : "Passport QR could not be generated.");
    }
  }

  return (
    <section className="workspace-page coffee-passport-page">
      <div className="workspace-page-header no-print">
        <div>
          <p className="eyebrow">{c.traceability}</p>
          <h2>{c.title}</h2>
          <p>{c.intro}</p>
        </div>
        {farm && <button className="primary-button" type="button" onClick={() => window.print()} disabled={!qrDataUrl}>{c.print}</button>}
      </div>

      <div className="settings-info-card no-print">
        <strong>Draft record â€” not an EUDR certificate.</strong> {c.disclaimerText}
      </div>

      {pageError && <p className="form-error" role="alert">{pageError}</p>}
      {loading ? <div className="empty-workspace">Loading registered farmsâ€¦</div> : !farms.length ? (
        <div className="empty-workspace"><h3>{c.register}</h3><p>{c.linked}</p></div>
      ) : (
        <>
          <div className="panel no-print coffee-passport-controls">
            <label>{c.farm}
              <select value={farmId} onChange={(event) => {
                setFarmId(event.target.value);
                setBoundaryError("");
                setQrError("");
                setLatitude("");
                setLongitude("");
              }}>
                {farms.map((item) => <option key={item.id} value={item.id}>{item.name} Â· {item.district}</option>)}
              </select>
            </label>
            {isOwner ? (
              <>
                <h3>{c.boundary}</h3>
                <p>{c.boundaryHelp}</p>
                <div className="passport-point-toolbar">
                  <button className="primary-button" type="button" onClick={captureBoundaryPoint}>ðŸ“ {c.capture}</button>
                  <span>{points.length} {c.points}</span>
                </div>
                <form className="passport-manual-point" onSubmit={addManualPoint}>
                  <label>Latitude<input type="number" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} required /></label>
                  <label>Longitude<input type="number" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} required /></label>
                  <button className="outline-button-sm" type="submit">{c.addPoint}</button>
                </form>
                {boundary.length > 0 && (
                  <div className="passport-points-list">
                    {boundary.map((point, index) => (
                      <div key={`${point.latitude}-${point.longitude}-${index}`}>
                        <span>Point {index + 1}: {point.latitude.toFixed(7)}, {point.longitude.toFixed(7)}</span>
                        <button className="text-button" type="button" onClick={() => {
                          setPoints(points.filter((_, pointIndex) => pointIndex !== index));
                          setQrSnapshot(null);
                        }}>{c.remove}</button>
                      </div>
                    ))}
                  </div>
                )}
                {boundaryError && <p className="form-error" role="alert">{boundaryError}</p>}
                <div className="passport-point-toolbar">
                  <strong>{c.area}: {boundaryArea ? `${boundaryArea.toFixed(3)} ha` : c.needThree}</strong>
                  <button className="primary-button" type="button" onClick={() => void handleSaveBoundary()} disabled={saving || points.length < 3}>
                    {saving ? "Savingâ€¦" : "Save boundary"}
                  </button>
                </div>
              </>
            ) : (
              <p>{c.ownerOnly}</p>
            )}
          </div>

          {farm && (
            <article className="panel passport-print">
              <div className="passport-print-header">
                <div>
                  <span className="section-kicker">AgriSense Â· Uganda</span>
                  <h2>{c.snapshot}</h2>
                  <span className="passport-draft-tag">{c.draft}</span>
                </div>
                {qrDataUrl && <img className="passport-qr" src={qrDataUrl} alt="QR code with the coffee farm passport snapshot and checksum" />}
              </div>
              <div className="passport-farm-details">
                <p><strong>Farm:</strong> {farm.name}</p>
                <p><strong>Farm reference:</strong> {farm.id}</p>
                <p><strong>Location:</strong> {farm.subCounty ? `${farm.subCounty}, ` : ""}{farm.district}, Uganda</p>
                <p><strong>GPS center:</strong> {farm.location.latitude.toFixed(6)}, {farm.location.longitude.toFixed(6)}</p>
                <p><strong>Variety:</strong> {(farm.coffeeVariety || "Not recorded").replace(/_/g, " ")}</p>
                <p><strong>Boundary area:</strong> {farm.boundaryAreaHectares ? `${farm.boundaryAreaHectares.toFixed(3)} ha` : "Not mapped"}</p>
                <p><strong>Boundary points:</strong> {farm.boundary?.length || 0}</p>
              </div>
              {previewPath && (
                <svg className="passport-boundary-preview" viewBox="0 0 300 180" role="img" aria-label="Schematic preview of the saved farm boundary">
                  <path d={previewPath} />
                </svg>
              )}
              <div className="passport-evidence">
                <h3>{c.details}</h3>
                <p>{screenings.length} {c.records}</p>
                {screenings.slice(0, 5).map((screening) => <small key={screening.id || screening.createdAt}>Screening: {screening.riskLevel}, {new Date(screening.createdAt).toLocaleDateString()} â€” not a confirmed diagnosis.</small>)}
                <p>{activities.length} farm activity record(s) available on this device.</p>
                {activities.slice(0, 5).map((activity) => <small key={activity.id}>{activity.date}: {activity.activityType.replace(/_/g, " ")} â€” {activity.title}</small>)}
                <p>{c.spray}</p>
                <p>{farm.passportAudit?.length || 0} owner-recorded boundary update(s).</p>
                {screenings[0] && <small>Latest screening: {screenings[0].riskLevel}, {new Date(screenings[0].createdAt).toLocaleDateString()} â€” screening only, not a confirmed diagnosis.</small>}
              </div>
              {farm.boundary?.length ? (
                <div className="passport-coordinates">
                  <strong>Saved boundary coordinates ({farm.boundary.length})</strong>
                  <ol>{farm.boundary.map((point, index) => <li key={`${point.latitude}-${point.longitude}-${index}`}>{point.latitude.toFixed(7)}, {point.longitude.toFixed(7)}</li>)}</ol>
                </div>
              ) : null}
              {qrError && <p className="form-error no-print" role="alert">{qrError}</p>}
              {snapshotHash && <p className="passport-hash"><strong>Snapshot SHA-256:</strong> {snapshotHash}</p>}
              <p className="passport-disclaimer">{c.notCertificate}</p>
              <div className="passport-actions no-print">
                <button className="outline-button-sm" type="button" onClick={() => void createPassportQr()} disabled={!isBoundarySaved}>
                  Generate local QR snapshot
                </button>
                <button className="outline-button-sm" type="button" onClick={() => window.print()} disabled={!qrDataUrl}>Print / Save as PDF</button>
              </div>
            </article>
          )}
        </>
      )}
    </section>
  );
}
