import { describe, it, expect } from "vitest";
import { computeMatchScore } from "./scoreEngine";

describe("computeMatchScore — smoke tests", () => {
  // Case 1: Perfect match → score 100
  it("perfect match yields score 100 with full breakdown", () => {
    const result = computeMatchScore(
      { skills: ["react", "typescript", "sql"], gpa: 8.5, workAuthStatus: "citizen" },
      { requiredSkills: ["react", "typescript", "sql"], minGpa: 7.0, sponsorshipOffered: false }
    );
    expect(result.score).toBe(100);
    expect(result.breakdown.skillScore).toBe(100);
    expect(result.breakdown.gpaScore).toBe(100);
    expect(result.breakdown.workAuthCompatible).toBe(true);
    expect(result.breakdown.matchedSkills).toEqual(["react", "typescript", "sql"]);
  });

  // Case 2: Zero skill overlap + incompatible work auth → score capped at 20
  it("zero skill overlap + incompatible work auth caps score at 20", () => {
    const result = computeMatchScore(
      { skills: ["photoshop"], gpa: 9.0, workAuthStatus: "visa_sponsorship_required" },
      { requiredSkills: ["react", "node"], minGpa: 6.0, sponsorshipOffered: false }
    );
    expect(result.score).toBe(20);
    expect(result.breakdown.skillScore).toBe(0);
    expect(result.breakdown.gpaScore).toBe(100);
    expect(result.breakdown.workAuthCompatible).toBe(false);
    expect(result.breakdown.matchedSkills).toEqual([]);
  });

  // Case 3: GPA 0.5 below cutoff → gpaScore 50, score 88
  it("GPA 0.5 below minGpa yields gpaScore 50 and score 88", () => {
    const result = computeMatchScore(
      { skills: ["python"], gpa: 6.5, workAuthStatus: "citizen" },
      { requiredSkills: ["python"], minGpa: 7.0, sponsorshipOffered: true }
    );
    expect(result.breakdown.gpaScore).toBe(50);
    expect(result.breakdown.workAuthCompatible).toBe(true);
    expect(result.breakdown.skillScore).toBe(100);
    // round(100×0.60 + 50×0.25 + 100×0.15) = round(60 + 12.5 + 15) = round(87.5) = 88
    expect(result.score).toBe(88);
  });

  // Case 4: Both skill sets empty → skillScore 100 (special case), score 100
  it("both skill sets empty yields skillScore 100 and score 100", () => {
    const result = computeMatchScore(
      { skills: [], gpa: 8.0, workAuthStatus: "citizen" },
      { requiredSkills: [], minGpa: 6.0, sponsorshipOffered: true }
    );
    expect(result.breakdown.skillScore).toBe(100);
    expect(result.score).toBe(100);
    expect(result.breakdown.matchedSkills).toEqual([]);
  });
});
