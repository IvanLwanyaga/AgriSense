import type {
  BctbAssessmentInput,
  BctbRiskLevel,
  BctbRiskResult,
  DataQuality,
  ShapContribution,
  WeatherMetrics,
} from "../types/bctb";
import type { RuleConfiguration } from "../types/ruleConfig";
import { getActiveRuleConfiguration } from "./bctbRuleConfig";

export const BCTB_ENGINE_VERSION = "bctb-expert-rules-v1.0.0";
export const MANDATORY_DISCLAIMER =
  "This tool provides early BCTB-risk screening and is not a confirmed pest diagnosis. Consult a qualified agricultural extension officer for verification and management advice.";

export function evaluateDataQuality(input: Partial<BctbAssessmentInput>): DataQuality {
  if (!input || typeof input !== "object") return "INSUFFICIENT";

  const coreFields = [
    input.pinSizedHoles,
    input.blackening,
    input.wilting,
    input.drying,
    input.yellowing,
    input.increasingTwigDamage,
    input.previousBctbHistory,
    input.affectedTwigRemoval,
    input.farmSanitation,
  ];

  const answeredCount = coreFields.filter((v) => v !== null && v !== undefined).length;

  if (answeredCount < 4) return "INSUFFICIENT";
  if (answeredCount < coreFields.length) return "LIMITED";
  return "GOOD";
}

export function determineRiskLevel(
  score: number,
  thresholds: RuleConfiguration["thresholds"]
): BctbRiskLevel {
  if (score > thresholds.moderateMax) return "HIGH";
  if (score > thresholds.lowMax) return "MODERATE";
  return "LOW";
}

export function generateSafeAdvisory(
  riskLevel: BctbRiskLevel,
  lang: "en" | "lg" | "sw" | "nyn" = "en"
): string[] {
  if (lang === "lg") {
    if (riskLevel === "HIGH") {
      return [
        "Okukebereka mu Nnimiro: Kebera amatabi gonna g'emwanyi za Robusta amatonotono wansi olabe obutuli obutono obwa 1mm.",
        "Okusalira okw'Obuyonjo: Sala amatabi agalwadde 5 cm (inci 2) wansi w'ekituli ekisembayo wansi ng'okozesa makansi z'obulimi ezinyonjo.",
        "Okwokera mu Kisawo: Teeka amatabi gonna agasaliddwa mu bisawo amangu ago era gookere ebweru w'ennimiro y'emwanyi okuzikiriza obunyo n'amagi.",
        "Okutema Amasejjere: Tema amasejjere gonna agamera wansi ku kikolo ky'omwanyi okulobera ebiwuka okulinnyirako.",
        "Okutuukirira Omukugu: Weereza alipoota eno eri omukugu w'ebyobulimi mu ggombolola akukyalire mu nnimiro.",
      ];
    }
    if (riskLevel === "MODERATE") {
      return [
        "Okulondoola Buli Wiiki: Kebera emiti 20 egy'emwanyi buli wiiki ng'otambula mu musiri, naddala ng'otunuulira amatabi agabiise oba agawotose.",
        "Okusalako Amatabi Amakaze: Sala amatabi gonna agawotose oba amakaze era gookere ebweru w'ennimiro y'emwanyi.",
        "Okusalako Ebisikirize: Salako ebisikirize ebingi okulekawo omusana ogw'ekigero (30-40%) okuziyiza obunyogovu obukuza ebiwuka.",
        "Obuyonjo bw'Ennimiro: Kuuma wansi w'emiti nga wayonjo, tewali bikoola bikaafu oba amatabi amakaze agasaasaanidde.",
      ];
    }
    return [
      "Okwekenneenya Buli Mwezi: Kebera amatabi g'emwanyi buli mwezi, naddala ng'ekyeya kinaatera okutandika.",
      "Enkola Z'obulimi Ennungi: Kuuma obuyonjo bw'ennimiro, tema amasejjere, era weebale okusalira obulungi.",
      "Obuyonjo bw'Ebyuma: Longoosa ebyuma by'osalisa n'eddagala eritirimbula obuwuka nga tonnasalira muti mulala.",
    ];
  }

  if (lang === "sw") {
    if (riskLevel === "HIGH") {
      return [
        "Ukaguzi wa Shamba: Kagua kwa makini chini ya matawi ya kahawa ya Robusta kuona matundu madogo (mm 1) yaliyotobolewa na kidungadunga.",
        "Kupogoa kwa Usafi: Kata matawi yaliyoathirika angalau sm 5 (inchi 2) chini ya tundu la mwisho lililotobolewa.",
        "Kuchoma Moto Ndani ya Gunia: Weka matawi yaliyokatwa mara moja ndani ya magunia na uyachome moto kabisa nje ya shamba.",
        "Kukata Chipukizi: Kata chipukizi zote za chini kuzuia wadudu kupanda kwa urahisi.",
        "Uthibitisho wa Afisa Ugani: Wasiliana na afisa ugani wa eneo lako akutembelee shambani kuthibitisha na kutoa mwongozo.",
      ];
    }
    if (riskLevel === "MODERATE") {
      return [
        "Ufuatiliaji wa Kila Wiki: Chunguza angalau miti 20 ya kahawa kila wiki, hasa ukiangalia matawi yaliyoanza kunyauka.",
        "Kuondoa Matawi Yaliyokaushwa: Kata matawi yote makavu au yaliyonyauka na kuyachoma moto nje ya shamba.",
        "Kupunguza Vivuli vya Miti: Punguza matawi ya miti ya kivuli ili kuruhusu mwanga wa jua (30-40%) kupunguza unyevu unaolea wadudu.",
        "Kudumisha Usafi: Weka shamba safi bila uchafu wa matawi yaliyoanguka ardhini.",
      ];
    }
    return [
      "Ukaguzi wa Kawaida: Endelea kukagua matawi mara moja kila mwezi, hasa kabla ya kuanza kwa msimu wa ukame.",
      "Mbinu Bora za Kilimo: Kata chipukizi mara kwa mara na palilia shamba lako vizuri.",
      "Kusafisha Vifaa: Safisha mikasi ya kupogolea kabla na baada ya kazi.",
    ];
  }

  if (lang === "nyn") {
    if (riskLevel === "HIGH") {
      return [
        "Okushwijuma Omusiri: Reeba gye ahansi y'amataagi g'omwani gwa Robusta yaaba hine obuturi bwa mm 1 obw'enyo.",
        "Okushara kw'Obwecereze: Shara amataagi agarwaire 5cm ahansi y'ekituri ekyafiire omu muringo gwa sayansi.",
        "Kwootsya omu Nshaho: Ta amataagi goona omu nshaho ogotsye ahonaaho aheeru y'omusiri kwita enyo n'amagi gaayo.",
        "Okutema Amasejjere: Tema amasejjere goona agamezire ahansi gatakariire ebiwuka ebirikukwata amatabi.",
        "Okushaba Omuhabuzi: Weereza alipoota egi omuhabuzi w'ebyoburimi aije kutaayayira omusiri gwawe.",
      ];
    }
    if (riskLevel === "MODERATE") {
      return [
        "Okurondoola Buri Saabiiti: Shwijuma emiti 20 buri saabiiti oreebe amataagi agaakwasirwe.",
        "Okwihaaho Amataagi Goomire: Shara amataagi goona agabiise ogootsye aheeru y'omusiri.",
        "Okushungura Ebibisi: Shungura ebibisi by'emiti kureka omusana gw'ekigyezo (30-40%) kureetera obutonde kwoma.",
        "Obwecereze bw'Eitaka: Kuuma ahansi y'emiti hasiimire gye ahatariho mashoobo.",
      ];
    }
    return [
      "Okushwijuma Buri Kweezi: Gumizamu n'okushwijuma amataagi g'omwani buri kweezi.",
      "Engyenderwaho Nungi z'Ebyoburimi: Tema amasejjere buriijo reero oyombekye gye omusiri gwawe.",
      "Kwozya Ebyuma: Ozye amakansi g'okushaza omu muringo gw'obwecereze.",
    ];
  }

  // Default English
  if (riskLevel === "HIGH") {
    return [
      "Field Inspection: Systematically inspect primary and secondary branches across your Robusta coffee trees for tiny pin-holes (1 mm) on the twig undersides.",
      "Sanitary Pruning: Cut infested twigs at least 5 cm (2 inches) below the lowest beetle entrance hole using clean secateurs.",
      "Sanitary Burning: Immediately gather all pruned twigs into bags and burn them thoroughly off-field to destroy adult beetles, larvae, and fungal ambrosia.",
      "Desuckering: Strip unneeded base suckers/water sprouts to prevent beetles from using low canopy shoots as bridges.",
      "Extension Verification: Submit your assessment for an on-farm verification visit by your sub-county agricultural extension officer.",
    ];
  }

  if (riskLevel === "MODERATE") {
    return [
      "Weekly Monitoring: Scout at least 20 Robusta coffee trees in a zigzag pattern weekly, paying attention to drooping or yellowing twig tips.",
      "Prompt Twig Removal: Clip any observed dry or wilting twigs immediately and burn them safely outside the coffee block.",
      "Canopy Shade Management: Regulate excessive shade trees to allow 30–40% filtered sunlight, discouraging damp microclimates favorable to beetle colonization.",
      "Sanitation Maintenance: Keep the plantation ground clean of dried prunings and fallen branches.",
    ];
  }

  return [
    "Routine Monitoring: Continue monthly inspections of coffee branches, especially before and during dry spells.",
    "Standard Agronomic Care: Maintain routine desuckering, weeding, and balanced tree nutrition to keep coffee vigor high.",
    "Sanitary Preparedness: Keep pruning tools disinfected and dispose of old plant material away from the coffee block.",
  ];
}

/**
 * Deterministic BCTB Expert Rule-Based Risk Screening Engine.
 *
 * Given the same inputs, weather metrics, and rule configuration,
 * it guarantees the exact same risk score, level, and explanations.
 */
export function assessBctbRisk(
  input: Partial<BctbAssessmentInput>,
  weatherSnapshot?: WeatherMetrics | null,
  customConfig?: RuleConfiguration,
  lang: "en" | "lg" | "sw" | "nyn" = "en"
): BctbRiskResult {
  const config = customConfig || getActiveRuleConfiguration();
  const w = config.weights;
  const thresholds = config.thresholds;

  let totalScore = 0;
  const shapContributions: ShapContribution[] = [];
  const triggeredFactors: string[] = [];

  // Safe input extraction (handles null, undefined, invalid types safely)
  const safeInput: BctbAssessmentInput = {
    previousBctbHistory: typeof input?.previousBctbHistory === "boolean" ? input.previousBctbHistory : null,
    increasingTwigDamage: typeof input?.increasingTwigDamage === "boolean" ? input.increasingTwigDamage : null,
    affectedTwigCount: typeof input?.affectedTwigCount === "number" && !isNaN(input.affectedTwigCount) && input.affectedTwigCount >= 0 ? Math.floor(input.affectedTwigCount) : null,
    yellowing: typeof input?.yellowing === "boolean" ? input.yellowing : null,
    pinSizedHoles: typeof input?.pinSizedHoles === "boolean" ? input.pinSizedHoles : null,
    blackening: typeof input?.blackening === "boolean" ? input.blackening : null,
    wilting: typeof input?.wilting === "boolean" ? input.wilting : null,
    drying: typeof input?.drying === "boolean" ? input.drying : null,
    hasAlternativeHosts: typeof input?.hasAlternativeHosts === "boolean" ? input.hasAlternativeHosts : null,
    unmanagedSuckersPresent: typeof input?.unmanagedSuckersPresent === "boolean" ? input.unmanagedSuckersPresent : null,
    recentPruning: typeof input?.recentPruning === "boolean" ? input.recentPruning : null,
    recentDeSuckering: typeof input?.recentDeSuckering === "boolean" ? input.recentDeSuckering : null,
    affectedTwigRemoval: input?.affectedTwigRemoval || null,
    farmSanitation: input?.farmSanitation || null,
    shadeCanopy: input?.shadeCanopy || null,
    coffeeAge: input?.coffeeAge || null,
    locationConsent: Boolean(input?.locationConsent),
    followUpConsent: Boolean(input?.followUpConsent),
    farmerNotes: typeof input?.farmerNotes === "string" ? input.farmerNotes.trim() : "",
    optionalPhotoUrl: input?.optionalPhotoUrl || null,
  };

  // Rule 1: Pin-sized holes on underside of twigs (Direct beetle symptom)
  if (safeInput.pinSizedHoles === true) {
    const pts = w.pinSizedHoles;
    totalScore += pts;
    shapContributions.push({
      feature: "Pin-sized holes on twig underside",
      value: "Reported",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Pin-sized entry holes observed on the underside of Robusta coffee twigs (primary BCTB physical sign).");
  }

  // Rule 2: Increasing twig damage over recent weeks
  if (safeInput.increasingTwigDamage === true) {
    const pts = w.increasingDamage;
    totalScore += pts;
    shapContributions.push({
      feature: "Increasing twig damage",
      value: "Reported spreading",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Twig wilting and dieback has been spreading or increasing recently on the farm.");
  }

  // Rule 3: Twig wilting or drying (Vascular blockage)
  if (safeInput.wilting === true || safeInput.drying === true) {
    const pts = w.twigWiltingDrying;
    totalScore += pts;
    shapContributions.push({
      feature: "Twig wilting / drying",
      value: "Observed",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Wilting and drying of twigs reported distal to beetle entry points.");
  }

  // Rule 4: Twig blackening (Ambrosia necrosis)
  if (safeInput.blackening === true) {
    const pts = w.twigBlackening;
    totalScore += pts;
    shapContributions.push({
      feature: "Twig blackening",
      value: "Observed",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Twig blackening and necrosis observed along affected branches.");
  }

  // Rule 5: Leaf yellowing / chlorosis
  if (safeInput.yellowing === true) {
    const pts = w.leafYellowing;
    totalScore += pts;
    shapContributions.push({
      feature: "Leaf yellowing",
      value: "Observed",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Yellowing leaves observed on affected coffee branches.");
  }

  // Rule 6: Affected twig count
  if (safeInput.affectedTwigCount !== null && safeInput.affectedTwigCount > 0) {
    const pts = Math.min(w.maxTwigCountScore, safeInput.affectedTwigCount * w.affectedTwigCountFactor);
    totalScore += pts;
    shapContributions.push({
      feature: "Observed affected twigs count",
      value: `${safeInput.affectedTwigCount} twigs`,
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push(`${safeInput.affectedTwigCount} affected twigs reported during farm scouting.`);
  }

  // Rule 7: Farm BCTB History
  if (safeInput.previousBctbHistory === true) {
    const pts = w.previousBctbHistory;
    totalScore += pts;
    shapContributions.push({
      feature: "Farm previous BCTB history",
      value: "Confirmed past occurrence",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Prior history of BCTB infestation recorded on this coffee block or neighboring plots.");
  }

  // Rule 8: Twig removal sanitation
  if (safeInput.affectedTwigRemoval === "NONE") {
    const pts = w.inconsistentTwigRemoval;
    totalScore += pts;
    shapContributions.push({
      feature: "Infested twig sanitation",
      value: "Not removed or burned",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Infested twigs are not pruned and burned, allowing emerging broods to re-infest neighboring stems.");
  } else if (safeInput.affectedTwigRemoval === "INCONSISTENT") {
    const pts = Math.round(w.inconsistentTwigRemoval * 0.6);
    totalScore += pts;
    shapContributions.push({
      feature: "Infested twig sanitation",
      value: "Inconsistently removed",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Sanitary pruning and burning of infested twigs has been irregular.");
  } else if (safeInput.affectedTwigRemoval === "CONSISTENT") {
    shapContributions.push({
      feature: "Sanitary pruning & burning",
      value: "Consistently practiced",
      contribution: -5,
      direction: "DECREASES_RISK",
    });
    totalScore = Math.max(0, totalScore - 5);
  }

  // Rule 9: Farm sanitation
  if (safeInput.farmSanitation === "POOR") {
    const pts = w.poorSanitation;
    totalScore += pts;
    shapContributions.push({
      feature: "Overall farm sanitation",
      value: "Poor",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Poor farm sanitation (unmanaged ground prunings and excess weeds harboring beetles).");
  }

  // Rule 10: Dense shade canopy
  if (safeInput.shadeCanopy === "DENSE") {
    const pts = w.denseShade;
    totalScore += pts;
    shapContributions.push({
      feature: "Shade canopy density",
      value: "Dense shade (>60%)",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push("Dense shade canopy creates a damp microclimate conducive to borer breeding.");
  }

  // Rule 11 & 12: Weather context (if weather metrics available)
  // Rule 11: Alternative Host Trees Nearby (Albizia, Avocado, Erythrina, etc.)
  if (safeInput.hasAlternativeHosts === true) {
    const pts = 8;
    totalScore += pts;
    shapContributions.push({
      feature: "Alternative host trees nearby",
      value: "Present (Albizia/Avocado/Erythrina)",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push(
      lang === "lg"
        ? "Emiti emirala egikyaza olunyo (nk'ebikooko, avocado, maanyi) eri kumpi n'emwanyi."
        : lang === "sw"
        ? "Miti mingine inayopokea wadudu (kama parachichi, albizia) iko karibu na kahawa."
        : lang === "nyn"
        ? "Emiti erikutunga enyo (nk'omwacado, omuko) eri haihi n'omwani."
        : "Alternative host trees (e.g., Albizia, avocado, mango) nearby act as borer reservoirs."
    );
  }

  // Rule 12: Unmanaged Water Suckers
  if (safeInput.unmanagedSuckersPresent === true) {
    const pts = 7;
    totalScore += pts;
    shapContributions.push({
      feature: "Unmanaged water suckers",
      value: "Dense suckers present",
      contribution: pts,
      direction: "INCREASES_RISK",
    });
    triggeredFactors.push(
      lang === "lg"
        ? "Amasejjere amangi agakula ku bikolo bireetera obunyo obwangu okuyingira."
        : lang === "sw"
        ? "Chipukizi mengi yanayoota chini ya miti yanavutia wadudu kutoboa."
        : lang === "nyn"
        ? "Amasejjere maingi nigaha enyo oburingo bworobi bw'okutaahamu."
        : "Dense water suckers provide tender shoot tissue for borer colonization."
    );
  }

  // Rule 13 & 14: Weather context (if weather metrics available)
  let weatherAvailable = false;
  const currentWeather =
    weatherSnapshot?.granularity === "UNAVAILABLE" ? null : weatherSnapshot;
  if (currentWeather) {
    weatherAvailable = true;
    if (currentWeather.consecutiveDrySpellDays >= 14) {
      const pts = w.weatherDrySpellDays;
      totalScore += pts;
      shapContributions.push({
        feature: "Consecutive dry-spell days",
        value: `${currentWeather.consecutiveDrySpellDays} days (<1.0 mm)`,
        contribution: pts,
        direction: "INCREASES_RISK",
      });
      triggeredFactors.push(`Prolonged dry spell (${currentWeather.consecutiveDrySpellDays} consecutive dry days) induces coffee water stress.`);
    }

    if (currentWeather.cumulativeRainfall30dMm < 50) {
      const pts = w.weatherRainDeficit;
      totalScore += pts;
      shapContributions.push({
        feature: "30-day cumulative rainfall deficit",
        value: `${currentWeather.cumulativeRainfall30dMm.toFixed(1)} mm (<50 mm)`,
        contribution: pts,
        direction: "INCREASES_RISK",
      });
      triggeredFactors.push(`30-day rainfall deficit (${currentWeather.cumulativeRainfall30dMm.toFixed(1)} mm) below normal Robusta threshold.`);
    }
  }

  // Score clamping between 0 and 100
  const internalScore = Math.min(100, Math.max(0, totalScore));
  const riskLevel = determineRiskLevel(internalScore, thresholds);
  const dataQuality = evaluateDataQuality(input);

  const advisoryCategory =
    riskLevel === "HIGH"
      ? "REQUEST_VERIFICATION"
      : riskLevel === "MODERATE"
      ? "INSPECT"
      : "MONITOR";

  const getExplanation = () => {
    if (lang === "lg") {
      return riskLevel === "HIGH"
        ? "Okukebera kulaga obulabe bwa BCTB obw'ekitalo: Obubonero obukulu (obutuli obutono wansi w'amatabi, amatabi agawotose n'agabiise) bulabiddwa. Kyetaagisa okusalira amangu amatabi 5cm wansi w'ekituli, okwookera mu bisawo, n'okutuukirira omukugu w'ebyobulimi."
        : riskLevel === "MODERATE"
        ? "Okukebera kulaga obulabe bwa BCTB obw'ekigero: Obubonero bw'ebyeya n'obulwadde butandise okulabika. Kebera buli wiiki era oyereze omusiri gwo obutakkiriza biwuka kusaasaana."
        : "Obulabe bwa BCTB buli wansi: Ebyalondoolwa tebiraga biwuka bicaase. Ggwe genda mu maaso n'okwekenneenya n'obuyonjo bw'ennimiro obwa bulijjo.";
    }
    if (lang === "sw") {
      return riskLevel === "HIGH"
        ? "Ukaguzi unaonyesha hatari kubwa ya BCTB: Viashiria vikuu (matundu madogo chini ya matawi, kunyauka na weusi) vimegunduliwa. Ni muhimu kupogoa matawi sm 5 chini ya tundu mara moja, kuchoma ndani ya magunia, na kuomba uthibitisho wa afisa ugani."
        : riskLevel === "MODERATE"
        ? "Ukaguzi unaonyesha hatari ya wastani ya BCTB: Viashiria vya tahadhari vimeonekana. Fanya ukaguzi wa kila wiki na udumishe usafi kuzuia kuzaliana kwa wadudu."
        : "Hatari ndogo ya BCTB: Hakuna viashiria vya hatari vilivyopatikana. Endelea na utunzaji mzuri wa kawaida wa shamba.";
    }
    if (lang === "nyn") {
      return riskLevel === "HIGH"
        ? "Okushwijuma kurikworeka oburemeezi bwa waggulu obwa BCTB: Obubonero bukuru (obuturi ahansi y'amataagi, okwoma kw'amataagi) bwareebwa. Shiikira ahonaaho osharye amataagi 5cm ahansi y'ekituri ogootsye omu nshaho, kandi oshabe omuhabuzi akutaayayire."
        : riskLevel === "MODERATE"
        ? "Okushwijuma kurikworeka oburemeezi bw'ekigyezo obwa BCTB: Obubonero butandikire kureebeka. Shwijuma buri saabiiti kandi oyonje omusiri gwawe."
        : "Oburemeezi bwa BCTB buri ahansi: Ebyashwijumwa tibyoreka buremeezi bwa maani. Gumizamu n'okuriinda omusiri gwawe gye.";
    }
    return riskLevel === "HIGH"
      ? "Elevated BCTB risk screening: Multiple critical physical indicators (e.g., pin-holes, spreading twig dieback) were detected under favorable borer conditions. Immediate sanitary pruning, burning of infested twigs, and extension verification are required."
      : riskLevel === "MODERATE"
      ? "Moderate BCTB risk screening: Notable warning indicators or moisture stress conditions were observed. Weekly scouting and cultural sanitation are recommended to prevent pest buildup."
      : "Low BCTB risk screening: Current reported farm observations and environmental conditions do not show elevated borer risk. Continue standard GAP monitoring.";
  };

  const getNextSteps = () => {
    if (lang === "lg") {
      return riskLevel === "HIGH"
        ? "Salira amatabi gonna agalina obutuli 5cm wansi w'ekituli, gookere mu kisawo amangu ago, era weereza alipoota eri omukugu w'ebyobulimi."
        : riskLevel === "MODERATE"
        ? "Kebera emiti 20 buli wiiki, sala amatabi amakaze gookere ebweru, era salako ebisikirize ebingi."
        : "Genda mu maaso n'okwekenneenya buli mwezi n'obuyonjo bwa bulijjo.";
    }
    if (lang === "sw") {
      return riskLevel === "HIGH"
        ? "Pogoa matawi yote yenye matundu sm 5 chini ya tundu, yachome mara moja kwenye magunia, na uombe uthibitisho wa afisa ugani."
        : riskLevel === "MODERATE"
        ? "Kagua miti 20 ya kahawa kila wiki, kata na uchome matawi makavu, na upunguze miti ya kivuli."
        : "Endelea na ukaguzi wa kila mwezi na usafi wa kawaida wa shamba.";
    }
    if (lang === "nyn") {
      return riskLevel === "HIGH"
        ? "Shara amataagi goona againe obuturi 5cm ahansi y'ekituri, gootsye ahonaaho omu nshaho, reero oheereze alipoota aha muhabuzi."
        : riskLevel === "MODERATE"
        ? "Shwijuma emiti 20 buri saabiiti, shara amataagi goomire ogotsye, kandi oshungure ebibisi."
        : "Gumizamu n'okushwijuma buri kweezi n'obwecereze bw'omusiri.";
    }
    return riskLevel === "HIGH"
      ? "Systematically prune all twigs with entrance holes 5cm below the hole, burn them immediately in sacks, and submit an on-site verification request to your extension officer."
      : riskLevel === "MODERATE"
      ? "Inspect 20 coffee trees weekly across your block, remove and burn any dried twigs, and thin heavy shade trees."
      : "Continue regular monthly scouting of branch undersides and maintain routine plantation sanitation.";
  };

  // Sort SHAP contributions by absolute magnitude descending
  shapContributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    riskLevel,
    internalScore,
    triggeredFactors: triggeredFactors.slice(0, 5),
    explanation: getExplanation(),
    nextSteps: getNextSteps(),
    advisoryCategory,
    safeAdvisory: generateSafeAdvisory(riskLevel, lang),
    disclaimer: MANDATORY_DISCLAIMER,
    dataQuality,
    weatherAvailable,
    weatherSnapshot: weatherSnapshot || null,
    engineType: "EXPERT_RULES",
    engineVersion: BCTB_ENGINE_VERSION,
    ruleConfigVersion: config.version,
    validationStatus: config.validationStatus,
    shapContributions,
    followUpConsent: safeInput.followUpConsent,
    locationConsent: safeInput.locationConsent,
    optionalPhotoUrl: safeInput.optionalPhotoUrl,
    createdAt: new Date().toISOString(),
  };
}
