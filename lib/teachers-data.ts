// PREVIEW SAMPLE DATA. These are placeholder teachers for layout review only.
// They are not real people. Websites use example.com on purpose so no real
// site is referenced. The production teacher directory needs a real `teachers`
// table (schema change, pending approval) and verified, opt-in listings.

export type Teacher = {
  id: string;
  name: string;
  city: string;
  state: string;
  website: string; // public business site only, never a personal address
  contact: string; // how players reach them (kept to a public channel)
  isAmbassador: boolean;
};

export const SAMPLE_TEACHERS: Teacher[] = [
  { id: "t1", name: "Sample Teacher A", city: "Las Vegas", state: "Nevada", website: "https://example.com", contact: "Contact via website", isAmbassador: true },
  { id: "t2", name: "Sample Teacher B", city: "Henderson", state: "Nevada", website: "https://example.com", contact: "Contact via website", isAmbassador: false },
  { id: "t3", name: "Sample Teacher C", city: "Scottsdale", state: "Arizona", website: "https://example.com", contact: "Contact via website", isAmbassador: true },
  { id: "t4", name: "Sample Teacher D", city: "Phoenix", state: "Arizona", website: "https://example.com", contact: "Contact via website", isAmbassador: false },
  { id: "t5", name: "Sample Teacher E", city: "Boca Raton", state: "Florida", website: "https://example.com", contact: "Contact via website", isAmbassador: true },
  { id: "t6", name: "Sample Teacher F", city: "Naples", state: "Florida", website: "https://example.com", contact: "Contact via website", isAmbassador: false },
  { id: "t7", name: "Sample Teacher G", city: "Great Neck", state: "New York", website: "https://example.com", contact: "Contact via website", isAmbassador: false },
  { id: "t8", name: "Sample Teacher H", city: "Plano", state: "Texas", website: "https://example.com", contact: "Contact via website", isAmbassador: true },
];

export const TEACHER_STATES = Array.from(new Set(SAMPLE_TEACHERS.map((t) => t.state))).sort();
