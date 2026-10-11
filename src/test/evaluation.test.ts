import { describe, expect, it } from "vitest";
import { attendanceRisk, markRisk, mentorRecommendations, subjectBand } from "@/lib/evaluation";

describe("evaluation rules", () => {
  it("colors subjects: <50 red, 50-60 yellow, >=60 green", () => {
    expect(subjectBand(49.9)).toBe("red");
    expect(subjectBand(55)).toBe("yellow");
    expect(subjectBand(60)).toBe("green");
  });
  it("mark risk thresholds", () => {
    expect(markRisk(45)).toBe("High");
    expect(markRisk(55)).toBe("Moderate");
    expect(markRisk(65)).toBe("Low");
  });
  it("attendance risk thresholds", () => {
    expect(attendanceRisk(60)).toBe("High");
    expect(attendanceRisk(70)).toBe("Moderate");
    expect(attendanceRisk(80)).toBe("Low");
  });
  it("mentor: strong >=70, developing 60-69, weak <60", () => {
    const m = mentorRecommendations([
      { course_code: "CS301", title: "DS", percent: 70, band: "green" },
      { course_code: "MA201", title: "Maths", percent: 59, band: "yellow" },
      { course_code: "PH101", title: "Phys", percent: 65, band: "green" },
    ]);
    expect(m.strong.map((s) => s.percent)).toEqual([70]);
    expect(m.developing.map((s) => s.percent)).toEqual([65]);
    expect(m.weak.map((s) => s.percent)).toEqual([59]);
    expect(m.weak[0]?.document).toContain("Formula sheets");
    expect(m.weak[0]?.video).toContain("3Blue1Brown");
  });
});
