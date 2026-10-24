import { describe, expect, it } from "vitest";
import { Compensation, LandParcel, RehabilitationCase } from "../src/modules/workspace/workspace.models.js";

describe("workspace record models", () => {
  it("defaults new land parcels to the identified stage", async () => {
    const parcel = new LandParcel({
      state: "Chhattisgarh",
      district: "Surguja",
      reference: "LP-2026-001",
      project: "NH-130 widening",
      surveyNumber: "12/4",
      ownerName: "A. Kumar",
      areaHectares: 1.25,
    });

    expect(parcel.status).toBe("Identified");
    await expect(parcel.validate()).resolves.toBeUndefined();
  });

  it("rejects compensation amounts below zero", async () => {
    const record = new Compensation({
      state: "Chhattisgarh",
      district: "Surguja",
      reference: "CA-2026-001",
      project: "NH-130 widening",
      parcelReference: "LP-2026-001",
      recipient: "A. Kumar",
      awardAmount: -1,
      paidAmount: 0,
    });

    await expect(record.validate()).rejects.toMatchObject({
      errors: { awardAmount: expect.anything() },
    });
  });

  it("requires a positive affected member count for rehabilitation cases", async () => {
    const record = new RehabilitationCase({
      state: "Chhattisgarh",
      district: "Surguja",
      reference: "RR-2026-001",
      project: "NH-130 widening",
      familyName: "Kumar",
      affectedMembers: 0,
      entitlement: "Housing support",
    });

    await expect(record.validate()).rejects.toMatchObject({
      errors: { affectedMembers: expect.anything() },
    });
  });
});
