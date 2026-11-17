import { useState } from "react";
import { detectTwig } from "../services/mlToolsService";

export default function TwigImageDetector() {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof detectTwig>> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function analyze() {
    if (!image || busy) return;
    setBusy(true); setError(""); setResult(null);
    try { setResult(await detectTwig(image)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Image analysis failed."); }
    finally { setBusy(false); }
  }

  return <section className="panel ml-tool-panel">
    <h3>Optional twig photo screening</h3>
    <p>Upload a clear twig photo to locate possible holes. This visual result is not a BCTB diagnosis.</p>
    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} />
    <button className="primary-button" type="button" onClick={analyze} disabled={!image || busy}>{busy ? "Analyzing…" : "Analyze photo"}</button>
    {error && <p role="alert">{error}</p>}
    {result && <div aria-live="polite"><p>{result.count} possible target(s).</p>{result.detections.map((item, index) =>
      <p key={`${item.class}-${index}`}>{item.class}: {Math.round(item.confidence * 100)}% confidence; box [{item.box.join(", ")}]</p>
    )}<small>{result.disclaimer}</small></div>}
  </section>;
}
