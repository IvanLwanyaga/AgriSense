import { describe, it, expect } from "vitest";
import { assessBctbRisk } from "./bctbRiskEngine";
import {
  queueAssessmentForSync,
  type QueuedAssessment,
} from "./offlineSyncService";
import type { BctbAssessmentInput, BctbRiskResult } from "../types/bctb";

function createRiskResult(): BctbRiskResult {
  return assessBctbRisk({
    pinSizedHoles: true,
    blackening: true,
    wilting: true,
    increasingTwigDamage: true,
  });
}

describe("Offline Sync Queue & State Machine", () => {
  it("rejects queuing when assessment does not match authenticated user", () => {
    const assessment: Partial<BctbAssessmentInput> = {
      farmerId: "mismatched_uid",
    };
    const riskResult = createRiskResult();

    expect(() => queueAssessmentForSync(assessment, riskResult)).toThrow(
      /Sign in to save this screening/
    );
  });

  it("handles offline queue data structure and status values", () => {
    const sampleQueueItem: QueuedAssessment = {
      id: "queue_123456789_abcdef",
      assessment: {
        pinSizedHoles: true,
        district: "Mukono",
        subCounty: "Kyampisi",
      },
      riskResult: createRiskResult(),
      timestamp: new Date().toISOString(),
      synced: false,
      status: "WAITING_TO_SYNC",
      retryCount: 0,
    };

    expect(sampleQueueItem.status).toBe("WAITING_TO_SYNC");
    expect(sampleQueueItem.synced).toBe(false);
    expect(sampleQueueItem.retryCount).toBe(0);

    // Simulate transition to failed
    sampleQueueItem.status = "SYNC_FAILED";
    sampleQueueItem.retryCount = 1;
    sampleQueueItem.error = "Network timeout";
    expect(sampleQueueItem.status).toBe("SYNC_FAILED");
    expect(sampleQueueItem.error).toBe("Network timeout");

    // Simulate transition to synced
    sampleQueueItem.status = "SYNCED";
    sampleQueueItem.synced = true;
    sampleQueueItem.error = undefined;
    expect(sampleQueueItem.status).toBe("SYNCED");
    expect(sampleQueueItem.synced).toBe(true);
  });
});
