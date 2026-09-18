export const exerciseTypes = [
  "dumbbell",
  "barbell",
  "bodyweight",
  "machine",
  "kettlebell",
  "resistance_band",
  "cable",
  "medicine_ball",
  "plyometric",
  "plate_loaded_machine",
] as const;
export const patterns = [
  "hip_hinge",
  "isolation",
  "squat",
  "vertical_push",
  "vertical_pull",
  "horizontal_pull",
  "horizontal_push",
  "rotation",
  "lunge",
  "carry",
] as const;
export const groups = [
  "glutes",
  "core",
  "quadriceps",
  "shoulders",
  "chest",
  "back",
  "hamstrings",
  "biceps",
  "forearms",
  "triceps",
  "rotator_cuff",
  "adductors",
  "calves",
  "neck",
] as const;
export interface Draft {
  name: string;
  exercise_type: (typeof exerciseTypes)[number];
  description: string;
  movement_pattern: (typeof patterns)[number];
  muscle_group: (typeof groups)[number];
  primary_muscles: string[];
  secondary_muscles: string[];
}
export interface Message {
  role: "user" | "assistant";
  content: string;
}
export interface GenerationResult {
  kind: "draft" | "clarification";
  message: string;
  draft: Draft | null;
}
export function validateResult(input: unknown, muscles: { name: string }[]): GenerationResult {
  if (!input || typeof input !== "object") throw new Error("Invalid model result");
  const result = input as GenerationResult;
  if (
    !["draft", "clarification"].includes(result.kind) ||
    typeof result.message !== "string" ||
    !result.message.trim() ||
    result.message.length > 4000
  )
    throw new Error("Invalid model result");
  if (result.kind === "clarification") {
    if (result.draft !== null) throw new Error("Clarification must not contain a draft");
    return result;
  }
  const d = result.draft;
  if (
    !d ||
    typeof d.name !== "string" ||
    !d.name.trim() ||
    d.name.length > 255 ||
    typeof d.description !== "string" ||
    !d.description.trim() ||
    d.description.length > 4000
  )
    throw new Error("Invalid exercise fields");
  if (
    !exerciseTypes.includes(d.exercise_type) ||
    !patterns.includes(d.movement_pattern) ||
    !groups.includes(d.muscle_group)
  )
    throw new Error("Invalid exercise classification");
  const known = new Set(muscles.map((m) => m.name));
  if (
    !Array.isArray(d.primary_muscles) ||
    !d.primary_muscles.length ||
    !Array.isArray(d.secondary_muscles)
  )
    throw new Error("Invalid muscle assignments");
  const all = [...d.primary_muscles, ...d.secondary_muscles];
  if (
    all.length > 20 ||
    new Set(all).size !== all.length ||
    all.some((m) => typeof m !== "string" || !known.has(m))
  )
    throw new Error("Invalid muscle assignments");
  return { ...result, draft: { ...d, name: d.name.trim() } };
}
export const resultSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "message", "draft"],
  properties: {
    kind: { type: "string", enum: ["draft", "clarification"] },
    message: { type: "string", minLength: 1, maxLength: 4000 },
    draft: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "name",
            "exercise_type",
            "description",
            "movement_pattern",
            "muscle_group",
            "primary_muscles",
            "secondary_muscles",
          ],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 255 },
            exercise_type: { type: "string", enum: exerciseTypes },
            description: { type: "string", minLength: 1, maxLength: 4000 },
            movement_pattern: { type: "string", enum: patterns },
            muscle_group: { type: "string", enum: groups },
            primary_muscles: {
              type: "array",
              minItems: 1,
              maxItems: 20,
              items: { type: "string" },
            },
            secondary_muscles: { type: "array", maxItems: 20, items: { type: "string" } },
          },
        },
      ],
    },
  },
};
