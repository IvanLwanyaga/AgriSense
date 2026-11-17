import type { FarmActivity } from "../types/activity";

const ACTIVITIES_STORAGE_KEY = "agrisense_farm_activities_v2";

export function getActivities(farmId?: string): FarmActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    const activities: FarmActivity[] = raw ? JSON.parse(raw) : [];
    return farmId ? activities.filter((activity) => activity.farmId === farmId) : activities;
  } catch {
    return [];
  }
}

export function logActivity(activity: Omit<FarmActivity, "id" | "createdAt">): FarmActivity {
  if (!activity.farmId || !activity.farmerId) {
    throw new Error("Choose a farm and signed-in farmer before saving an activity.");
  }

  const activities = getActivities();
  const newActivity: FarmActivity = {
    ...activity,
    id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  activities.unshift(newActivity);
  localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  return newActivity;
}
