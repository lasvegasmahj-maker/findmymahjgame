// PREVIEW SAMPLE DATA. Placeholder ambassador profiles for layout review only.
// Not real people. The production version needs profile fields (bio, photo,
// slug, referral code) on the ambassadors table plus photo storage, both
// pending approval. Photos here are shown as initials, not invented images.

export type AmbassadorProfile = {
  slug: string;
  name: string; // first name only in public views
  city: string;
  state: string;
  bio: string;
  refCode: string;
};

export const SAMPLE_PROFILES: AmbassadorProfile[] = [
  {
    slug: "ruth-las-vegas",
    name: "Ruth",
    city: "Las Vegas",
    state: "Nevada",
    bio: "I have taught American mahjong in the Las Vegas valley for years and love helping new players find a friendly table. We meet in public places like libraries and community centers, and beginners are always welcome.",
    refCode: "FMM-LV-RUTH",
  },
  {
    slug: "linda-scottsdale",
    name: "Linda",
    city: "Scottsdale",
    state: "Arizona",
    bio: "I organize games across Scottsdale and Phoenix and enjoy connecting players who are new to the area. Year-round residents and snowbirds alike are welcome to join a table.",
    refCode: "FMM-PHX-LINDA",
  },
  {
    slug: "carol-boca-raton",
    name: "Carol",
    city: "Boca Raton",
    state: "Florida",
    bio: "I host welcoming games in the Boca Raton and Palm Beach area. If you are looking for a regular group or just want to try mahjong, I would love to help you get to a table.",
    refCode: "FMM-BOCA-CAROL",
  },
];

export function getProfile(slug: string): AmbassadorProfile | undefined {
  return SAMPLE_PROFILES.find((p) => p.slug === slug);
}
