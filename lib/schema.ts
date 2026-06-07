/**
 * Schema.org JSON-LD builders for Find My Mahj Game.
 *
 * Usage in any Server Component page:
 *   import { buildXyzSchema } from "@/lib/schema";
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: JSON.stringify(buildXyzSchema(...)).replace(/</g, "\\u003c") }}
 *   />
 *
 * "use client" pages cannot render <script> tags in <head>. For those pages
 * (advertise, list-my-game, get-listed, how-it-works) use a Server Component
 * wrapper that adds generateMetadata + the schema script, then delegates the
 * interactive UI to the existing "use client" component.
 */

const SITE_URL = "https://findmymahjgame.com";
const SITE_NAME = "Find My Mahj Game";
const SITE_EMAIL = "hello@findmymahjgame.com";

/* ── SHARED ORGANIZATION NODE ─────────────────────────────────────────────── */

export const ORGANIZATION_NODE = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  email: SITE_EMAIL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  sameAs: ["https://lasvegasmahj.com"],
  founder: {
    "@type": "Person",
    "@id": `${SITE_URL}/#shauna-bruckman`,
    name: "Shauna Bruckman",
    jobTitle: "Founder & Certified Mahjong Instructor",
    worksFor: { "@id": `${SITE_URL}/#organization` },
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Las Vegas",
      addressRegion: "NV",
      addressCountry: "US",
    },
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  description:
    "The national mahjong directory connecting players, venues and events across all 50 states. Free for players.",
};

/* ── HOMEPAGE: Organization + WebSite + SearchAction ──────────────────────── */

export function buildHomepageSchema() {
  return [
    {
      "@context": "https://schema.org",
      ...ORGANIZATION_NODE,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description:
        "Find mahjong players, groups, open plays, venues and events in all 50 states.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/states/{search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

/* ── STATE PAGES: CollectionPage + ItemList + Events + BreadcrumbList ─────── */

export interface VenueInput {
  id: string;
  business_name: string;
  venue_type: string;
  city: string;
  state: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
}

export interface EventInput {
  id: string;
  event_name: string;
  event_type: string;
  city: string;
  state: string;
  venue: string | null;
  description: string | null;
  event_date: string | null;
  price: string | null;
  registration_url: string | null;
}

export interface StateSchemaInput {
  stateName: string;
  stateSlug: string;
  stateDesc: string;
  venues: VenueInput[];
  events: EventInput[];
}

function eventTypeToLabel(type: string): string {
  const map: Record<string, string> = {
    open_play: "Open Play",
    lesson: "Mahjong Lesson",
    tournament: "Tournament",
    retreat: "Retreat",
    social: "Social",
  };
  return map[type] ?? type;
}

export function buildStatePageSchema({ stateName, stateSlug, stateDesc, venues, events }: StateSchemaInput) {
  const pageUrl = `${SITE_URL}/states/${stateSlug}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Browse States",
        item: `${SITE_URL}/states`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Mahjong in ${stateName}`,
        item: pageUrl,
      },
    ],
  };

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}/#webpage`,
    name: `Mahjong Players, Venues & Events in ${stateName}`,
    description: stateDesc,
    url: pageUrl,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    breadcrumb: { "@id": `${pageUrl}/#breadcrumb` },
    about: {
      "@type": "Thing",
      name: `Mahjong in ${stateName}`,
    },
  };

  const schemas: object[] = [breadcrumb, collectionPage];

  // Venue ItemList with nested LocalBusiness nodes
  if (venues.length > 0) {
    const venueItemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Mahjong Venues in ${stateName}`,
      url: pageUrl,
      numberOfItems: venues.length,
      itemListElement: venues.map((venue, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "LocalBusiness",
          "@id": `${SITE_URL}/#venue-${venue.id}`,
          name: venue.business_name,
          description: venue.description ?? undefined,
          image: venue.logo_url ?? undefined,
          url: venue.website ?? pageUrl,
          address: {
            "@type": "PostalAddress",
            addressLocality: venue.city,
            addressRegion: venue.state,
            addressCountry: "US",
          },
          amenityFeature: {
            "@type": "LocationFeatureSpecification",
            name: "Mahjong",
            value: true,
          },
        },
      })),
    };
    schemas.push(venueItemList);
  }

  // Individual Event schemas
  for (const event of events) {
    if (!event.event_date) continue;

    const eventSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.event_name,
      description: event.description ?? `${eventTypeToLabel(event.event_type)} in ${event.city}, ${event.state}`,
      startDate: event.event_date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: event.venue ?? `${event.city}, ${event.state}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: event.city,
          addressRegion: event.state,
          addressCountry: "US",
        },
      },
      organizer: {
        "@id": `${SITE_URL}/#organization`,
      },
      url: event.registration_url ?? pageUrl,
    };

    if (event.price) {
      if (event.price.toLowerCase() === "free") {
        eventSchema.offers = {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: event.registration_url ?? pageUrl,
        };
      } else {
        eventSchema.offers = {
          "@type": "Offer",
          name: event.price,
          availability: "https://schema.org/InStock",
          url: event.registration_url ?? pageUrl,
        };
      }
    }

    schemas.push(eventSchema);
  }

  return schemas;
}

/* ── ABOUT PAGE ─────────────────────────────────────────────────────────────── */

export function buildAboutPageSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "@id": `${SITE_URL}/about/#webpage`,
      name: `About ${SITE_NAME}`,
      description:
        "Find My Mahj Game connects mahjong players across all 50 states with local games, events, retreats, tournaments and places to play.",
      url: `${SITE_URL}/about`,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
        ],
      },
      about: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@context": "https://schema.org",
      ...ORGANIZATION_NODE,
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${SITE_URL}/#shauna-bruckman`,
      name: "Shauna Bruckman",
      jobTitle: "Founder & Certified Mahjong Instructor",
      description:
        "Shauna Bruckman is a certified Oh My Mahjong (OMM) instructor and the founder of Find My Mahj Game and Las Vegas Mahjong.",
      url: `${SITE_URL}/about`,
      worksFor: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
      sameAs: ["https://lasvegasmahj.com"],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Las Vegas",
        addressRegion: "NV",
        addressCountry: "US",
      },
    },
  ];
}

/* ── HOW IT WORKS: FAQPage + HowTo (Players) + HowTo (Advertisers) ─────────── */

export function buildHowItWorksSchema() {
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/how-it-works/#webpage`,
    name: "How Find My Mahj Game Works",
    url: `${SITE_URL}/how-it-works`,
    mainEntity: [
      {
        "@type": "Question",
        name: "Is it free to list myself as a player?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Player listings are always 100% free. Find My Mahj Game will never charge players to find or list a game.",
        },
      },
      {
        "@type": "Question",
        name: "How do I find mahjong players near me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Go to your state page by clicking your state on the homepage map or navigating directly to findmymahjgame.com/states/[your-state]. Then use the city dropdown or enter your zip code to filter results.",
        },
      },
      {
        "@type": "Question",
        name: "How do I create a player listing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Click 'Create My Listing' on any state page or from the homepage map. Fill in your city, skill level, preferred schedule, and a short bio. Your listing goes live within 1-2 business days after review.",
        },
      },
      {
        "@type": "Question",
        name: "How do I connect with another player?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Click the Connect button on any player card. Submit your name, email, and an optional message. Find My Mahj Game will forward your request to that player.",
        },
      },
      {
        "@type": "Question",
        name: "How do businesses and venues get listed?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Fill out the form on the Advertise page or email hello@findmymahjgame.com. Listings are reviewed within 1-2 business days. Once approved and paid, your listing goes live within 24-48 hours.",
        },
      },
      {
        "@type": "Question",
        name: "How much does it cost to advertise?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Venue listings start at $19/month. A Featured Spot is $39/month and includes top placement, a highlighted listing, and a photo. The Official Mahj Spot tier is $79/month and includes homepage placement and a badge. Event and instructor listings are also available.",
        },
      },
      {
        "@type": "Question",
        name: "How long does it take for my listing to go live?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "All listings are reviewed within 1-2 business days. Once approved and payment is received, your listing goes live within 24-48 hours.",
        },
      },
      {
        "@type": "Question",
        name: "What states does Find My Mahj Game cover?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Find My Mahj Game covers all 50 US states. Every state has its own directory page with players, events, and venues.",
        },
      },
    ],
  };

  const howToPlayers = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Find a Mahjong Game Near You",
    description:
      "Use Find My Mahj Game to find mahjong players, events, and venues in your state. Free for players.",
    url: `${SITE_URL}/how-it-works`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Go to your state page",
        text: "Click your state on the map at findmymahjgame.com or navigate directly to findmymahjgame.com/states/[your-state]. Every state has its own page with players, events, and venues.",
        url: SITE_URL,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Search by city or zip code",
        text: "Use the city dropdown or enter your zip code and select your distance range: 5, 10, 25, or 50 miles. Results update instantly.",
        url: `${SITE_URL}/how-it-works`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Browse players, events, and venues",
        text: "Switch between the Players, Events, and Where to Play tabs to find exactly what you are looking for.",
        url: `${SITE_URL}/how-it-works`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Connect and play",
        text: "Click Connect on a player card, RSVP to an event, or visit a venue. It's always free for players.",
        url: `${SITE_URL}/list-my-game`,
      },
    ],
  };

  const howToListPlayer = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to List Yourself as a Mahjong Player",
    description:
      "Create a free player listing on Find My Mahj Game so other players in your area can find you.",
    url: `${SITE_URL}/list-my-game`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Click Create My Listing",
        text: "On any state page or from the map on the homepage, click 'Create My Listing'.",
        url: `${SITE_URL}/list-my-game`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Fill in your info",
        text: "Enter your city, skill level, preferred schedule, and a short bio. No last name or personal contact info is shown publicly.",
        url: `${SITE_URL}/list-my-game`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Go live",
        text: "Your listing is reviewed and appears on your state page within 1-2 business days. Players nearby can then connect with you. Always free.",
        url: `${SITE_URL}/list-my-game`,
      },
    ],
  };

  const howToAdvertise = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Get Your Business Listed on Find My Mahj Game",
    description:
      "List your mahjong venue, instructor profile, or event on Find My Mahj Game to reach players searching in your area.",
    url: `${SITE_URL}/get-listed`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Submit your inquiry",
        text: "Fill out the form on the Advertise page or email hello@findmymahjgame.com. Takes less than 2 minutes.",
        url: `${SITE_URL}/advertise`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "We review and approve",
        text: "All listings are reviewed within 1-2 business days. We maintain quality standards for all advertisers.",
        url: `${SITE_URL}/advertise`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Receive your invoice",
        text: "Once approved, you will receive a payment link. Choose monthly or annual billing.",
        url: `${SITE_URL}/advertise`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Go live",
        text: "Your listing or ad goes live within 24-48 hours of payment. Start reaching players right away.",
        url: `${SITE_URL}/advertise`,
      },
    ],
  };

  return [faqPage, howToPlayers, howToListPlayer, howToAdvertise];
}

/* ── SIMPLE PAGE SCHEMAS ────────────────────────────────────────────────────── */

export function buildContactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE_URL}/contact/#webpage`,
    name: "Contact Find My Mahj Game",
    description:
      "Get in touch with Find My Mahj Game. Questions about listings, advertising, partnerships or general inquiries.",
    url: `${SITE_URL}/contact`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
      ],
    },
  };
}

export function buildListMyGamePageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/list-my-game/#webpage`,
    name: "Create a Free Player Listing | Find My Mahj Game",
    description:
      "List yourself as a mahjong player so others in your area can find you. Free forever — no credit card required.",
    url: `${SITE_URL}/list-my-game`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "List My Game", item: `${SITE_URL}/list-my-game` },
      ],
    },
  };
}

export function buildGetListedPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/get-listed/#webpage`,
    name: "Get Your Business Listed | Find My Mahj Game",
    description:
      "List your mahjong venue, instructor profile, or event on the national mahjong directory.",
    url: `${SITE_URL}/get-listed`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Get Listed", item: `${SITE_URL}/get-listed` },
      ],
    },
  };
}

export function buildAdvertisePageSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_URL}/advertise/#webpage`,
      name: "Advertise on Find My Mahj Game",
      description:
        "Reach mahjong players across all 50 states. Venue listings, event promotions, instructor profiles, and brand advertising.",
      url: `${SITE_URL}/advertise`,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Advertise", item: `${SITE_URL}/advertise` },
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${SITE_URL}/advertise/#service`,
      name: "Mahjong Directory Advertising",
      serviceType: "Directory Advertising",
      description:
        "Venue listings, event promotions, instructor profiles, and brand advertising targeting mahjong players across all 50 US states.",
      provider: { "@id": `${SITE_URL}/#organization` },
      url: `${SITE_URL}/advertise`,
      areaServed: {
        "@type": "Country",
        name: "United States",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Advertising Tiers",
        itemListElement: [
          {
            "@type": "Offer",
            name: "Starter Listing",
            description: "Name, city, hours, description, website link",
            price: "19.00",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "RecurringCharge",
              price: "19.00",
              priceCurrency: "USD",
              billingIncrement: 1,
              unitText: "MONTH",
            },
          },
          {
            "@type": "Offer",
            name: "Featured Spot",
            description: "Top placement, highlighted listing, and photo",
            price: "39.00",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "RecurringCharge",
              price: "39.00",
              priceCurrency: "USD",
              billingIncrement: 1,
              unitText: "MONTH",
            },
          },
          {
            "@type": "Offer",
            name: "Official Mahj Spot",
            description: "Featured placement, homepage feature, and badge",
            price: "79.00",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "RecurringCharge",
              price: "79.00",
              priceCurrency: "USD",
              billingIncrement: 1,
              unitText: "MONTH",
            },
          },
        ],
      },
    },
  ];
}

/* ── UTILITY ─────────────────────────────────────────────────────────────────── */

export function schemaScriptProps(data: object | object[]) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    },
  };
}
