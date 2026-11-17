"""Translate model evidence into cautious, non-chemical field follow-up."""
from typing import Any

FEATURE_KEYS = {
    "Twig dieback observed": "twig_dieback_observed",
    "Suspected entry holes observed": "suspected_entry_holes_observed",
    "Affected twig count": "affected_twig_count_reported",
    "Previous BCTB report": "previous_bctb_report",
    "Farm sanitation": "farm_sanitation",
    "Pruning frequency": "pruning_frequency",
    "Recent pruning": "recent_pruning_done",
    "Twig damage increasing": "increasing_twig_damage",
    "Leaf yellowing observed": "yellowing_observed",
    "Twig blackening observed": "blackening_observed",
    "Wilting observed": "wilting_observed",
    "Drying observed": "drying_observed",
    "Nearby host vegetation": "nearby_host_vegetation",
    "Unmanaged suckers present": "unmanaged_suckers_present",
    "Recent desuckering": "recent_desuckering_done",
    "Affected twig removal": "affected_twig_removal",
    "Coffee age category": "coffee_age",
    "Shade canopy category": "shade_canopy",
    "Coffee variety": "coffee_variety",
    "Affected twig diameter": "affected_twig_diameter_mm",
    "Rainfall, previous 30 days": "rainfall_30d_mm",
    "Mean temperature, previous 30 days": "mean_temperature_30d_c",
    "Mean relative humidity, previous 30 days": "mean_relative_humidity_30d_pct",
    "Canopy cover": "canopy_cover_pct",
    "Shade tree count": "shade_tree_count",
    "Distance to woodland": "distance_to_woodland_m",
    "Drought stress observed": "drought_stress_observed",
    "Recently transplanted": "recently_transplanted",
    "Infested twigs removed": "infested_twigs_removed",
    "Coffee trees inspected": "coffee_trees_inspected",
    "Trees with possible signs": "trees_with_possible_signs",
    "Sample plot area": "plot_area_ha",
    "Shade tree species": "shade_tree_species",
    "Inspection month": "inspection_month",
}


def _advice_for(feature: str, inputs: dict[str, Any], predicted_risk: str) -> dict[str, Any] | None:
    high_priority = predicted_risk == "HIGH"
    if feature == "Suspected entry holes observed" and inputs["suspected_entry_holes_observed"] == 1:
        return {
            "code": "VERIFY_ENTRY_HOLES",
            "priority": "PROMPT" if high_priority else "ROUTINE",
            "title": "Verify the possible entry holes",
            "actions": [
                "Mark the affected tree and inspect nearby lateral twigs for fresh holes and dieback.",
                "Ask an agricultural extension officer to confirm the cause, especially if damage is spreading.",
                "If BCTB is confirmed, follow locally approved non-chemical sanitation: prune at least 5 cm below the hole, collect the twig, and safely dispose of infested material as the officer advises.",
            ],
            "requires_field_confirmation": True,
        }
    if feature == "Twig dieback observed" and inputs["twig_dieback_observed"] == 1:
        return {
            "code": "VERIFY_DIEBACK",
            "priority": "PROMPT" if high_priority else "ROUTINE",
            "title": "Check what is causing the dieback",
            "actions": [
                "Inspect the branch below the dying tip for pin-sized entry holes and record the affected tree.",
                "Request an extension officer's field check; dieback can have causes other than BCTB.",
            ],
            "requires_field_confirmation": True,
        }
    if feature == "Affected twig count" and inputs["affected_twig_count_reported"] > 0:
        return {
            "code": "RECHECK_AFFECTED_TWIGS",
            "priority": "PROMPT" if high_priority else "ROUTINE",
            "title": "Make the damage count repeatable",
            "actions": [
                f"Recheck the {inputs['affected_twig_count_reported']} reported twigs and record the number of affected trees in the same sampled block.",
                "Repeat the count on a later inspection using the same block and method to see whether damage is increasing.",
            ],
            "requires_field_confirmation": True,
        }
    if feature == "Previous BCTB report" and inputs["previous_bctb_report"] == 1:
        return {
            "code": "FOLLOW_PREVIOUS_REPORT",
            "priority": "ROUTINE",
            "title": "Revisit the previously affected block",
            "actions": [
                "Inspect the previously reported trees and nearby lateral branches, then record whether signs are present now.",
                "Use an extension officer to verify any new symptoms before treatment or major pruning decisions.",
            ],
            "requires_field_confirmation": True,
        }
    if feature == "Farm sanitation" and inputs["farm_sanitation"] == "poor":
        return {
            "code": "IMPROVE_SANITATION",
            "priority": "ROUTINE",
            "title": "Review twig sanitation",
            "actions": [
                "Collect dead, pruned, and confirmed infested twigs from the sampled block.",
                "Ask an extension officer about safe, locally approved disposal for infested material.",
            ],
            "requires_field_confirmation": False,
        }
    if feature == "Pruning frequency" and inputs["pruning_frequency"] in {"rare", "occasional"}:
        return {
            "code": "REVIEW_PRUNING_PLAN",
            "priority": "ROUTINE",
            "title": "Review the pruning schedule",
            "actions": [
                "Discuss a practical, regular pruning plan and clean-tool practice with an extension officer.",
                "Do not remove healthy branches solely because of this synthetic-data model result.",
            ],
            "requires_field_confirmation": False,
        }
    if feature == "Recent pruning" and inputs["recent_pruning_done"] == 1:
        return {
            "code": "CHECK_PRUNED_MATERIAL",
            "priority": "ROUTINE",
            "title": "Check recent pruning material",
            "actions": [
                "Inspect recent cuts and collected twigs for possible holes or dieback.",
                "Follow local extension guidance for safe handling of any confirmed infested material.",
            ],
            "requires_field_confirmation": True,
        }
    if feature in {"Twig damage increasing", "Leaf yellowing observed", "Twig blackening observed", "Wilting observed", "Drying observed"} and inputs[FEATURE_KEYS[feature]] == 1:
        return {
            "code": "VERIFY_ADDITIONAL_SYMPTOMS",
            "priority": "PROMPT" if high_priority else "ROUTINE",
            "title": "Check the reported plant symptoms",
            "actions": [
                "Mark the affected trees and record which symptoms occur together; these symptoms can have several causes.",
                "Ask an extension officer to inspect the branches before deciding on pruning or other action.",
            ],
            "requires_field_confirmation": True,
        }
    if feature in {"Nearby host vegetation", "Distance to woodland", "Shade canopy category", "Canopy cover", "Shade tree count", "Shade tree species", "Coffee age category", "Coffee variety", "Recent desuckering"}:
        return {
            "code": "RECORD_FARM_CONTEXT",
            "priority": "ROUTINE",
            "title": "Record nearby vegetation and shade conditions",
            "actions": [
                "Keep the location and shade measurements consistent between visits so the farm context can be reviewed.",
                "Do not remove shade trees or nearby vegetation based on this synthetic-model contribution; ask an extension officer to interpret it locally.",
            ],
            "requires_field_confirmation": True,
        }
    if feature in {"Rainfall, previous 30 days", "Mean temperature, previous 30 days", "Mean relative humidity, previous 30 days", "Inspection month"}:
        return {
            "code": "REVIEW_WEATHER_CONTEXT",
            "priority": "ROUTINE",
            "title": "Keep weather readings with the inspection record",
            "actions": [
                "Record the measurement source and the same 30-day period on follow-up visits.",
                "Treat this synthetic-model pattern as context only; weather contribution is not a field-validated forecast or an action recommendation.",
            ],
            "requires_field_confirmation": False,
        }
    if feature in {"Drought stress observed", "Recently transplanted"} and inputs[FEATURE_KEYS[feature]] == 1:
        return {
            "code": "CHECK_PLANT_STRESS",
            "priority": "ROUTINE",
            "title": "Check plant stress and establishment",
            "actions": [
                "Record which plants show stress and whether they were recently transplanted.",
                "Ask an extension officer about locally suitable moisture and establishment practices; this model does not establish the cause of stress.",
            ],
            "requires_field_confirmation": True,
        }
    if feature in {"Affected twig diameter", "Coffee trees inspected", "Trees with possible signs", "Sample plot area"}:
        return {
            "code": "STANDARDIZE_SAMPLE_MEASUREMENTS",
            "priority": "ROUTINE",
            "title": "Keep the sample measurements comparable",
            "actions": [
                "Use the same plot and inspection method on the next visit, and record how many trees and twigs were checked.",
                "Use the displayed field readings to describe only the inspected sample, not the whole farm.",
            ],
            "requires_field_confirmation": False,
        }
    if feature == "Infested twigs removed" and inputs["infested_twigs_removed"] == 0:
        return {
            "code": "REVIEW_TWIG_DISPOSAL",
            "priority": "ROUTINE",
            "title": "Review handling of affected twig material",
            "actions": [
                "If BCTB is confirmed, ask an extension officer how to safely collect and dispose of infested material under local guidance.",
                "Do not destroy healthy branches solely because of this synthetic-model result.",
            ],
            "requires_field_confirmation": True,
        }
    if feature == "Unmanaged suckers present" and inputs["unmanaged_suckers_present"] == 1:
        return {
            "code": "REVIEW_SUCKER_MANAGEMENT",
            "priority": "ROUTINE",
            "title": "Review sucker management",
            "actions": ["Ask an extension officer whether sucker management is appropriate for this block and season."],
            "requires_field_confirmation": True,
        }
    if feature == "Affected twig removal" and inputs["affected_twig_removal"] in {"inconsistent", "none"}:
        return {
            "code": "REVIEW_TWIG_DISPOSAL",
            "priority": "ROUTINE",
            "title": "Review handling of affected twig material",
            "actions": ["If infestation is confirmed, ask an extension officer about locally approved collection and disposal of affected material."],
            "requires_field_confirmation": True,
        }
    return None


def generate_recommendations(
    user_input: dict[str, Any],
    shap_values: list[dict[str, Any]],
    predicted_risk: str,
) -> dict[str, Any]:
    """Return top-three model evidence and matching field actions as structured JSON data.

    SHAP describes model behavior, not causality. Recommendations are separately
    gated on the farmer's observed values and request field confirmation.
    """
    top = sorted(shap_values, key=lambda item: abs(float(item["contribution"])), reverse=True)[:3]
    evidence = []
    recommendations = []
    seen_codes: set[str] = set()

    for item in top:
        feature = str(item["feature"])
        key = FEATURE_KEYS.get(feature)
        direction = str(item["direction"])
        evidence.append({
            "feature": feature,
            "value": item["value"],
            "contribution": float(item["contribution"]),
            "direction": direction,
            "interpretation": (
                f"This value supports the model's {predicted_risk.lower()} class."
                if direction == "SUPPORTS_PREDICTION"
                else f"This value opposes the model's {predicted_risk.lower()} class."
                if direction == "OPPOSES_PREDICTION"
                else "This value had little effect on the model class."
            ),
        })
        advice = _advice_for(feature, user_input, predicted_risk) if key and user_input.get(key) is not None else None
        if advice and advice["code"] not in seen_codes:
            seen_codes.add(advice["code"])
            recommendations.append({**advice, "evidence_feature": feature})

    observed_signs = (
        user_input["twig_dieback_observed"] == 1
        or user_input["suspected_entry_holes_observed"] == 1
        or user_input["affected_twig_count_reported"] > 0
    )
    return {
        "basis": "Top three absolute SHAP effects plus observed inputs; SHAP effects are model explanations, not causes.",
        "predicted_class": predicted_risk,
        "top_features": evidence,
        "items": recommendations,
        "extension_referral": {
            "recommended": bool(observed_signs or predicted_risk == "HIGH"),
            "reason": "Field confirmation is appropriate when possible damage is reported or the synthetic model assigns HIGH.",
        },
        "safety_note": "Research demonstration only. Confirm symptoms on the farm. Non-chemical guidance only; no pesticide advice.",
    }
