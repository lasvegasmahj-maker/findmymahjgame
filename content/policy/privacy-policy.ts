// Generated from docs/policy/drafts/privacy-policy.md by scripts/policy-content.mjs. Do not edit by
// hand: edit the draft and run `node scripts/policy-content.mjs`.
import type { PolicyDocument } from "@/components/policy-doc";

export const doc: PolicyDocument = {
  "route": "/privacy",
  "title": "Privacy Policy",
  "updated": "August 29, 2026",
  "intro": [
    {
      "type": "p",
      "text": "This policy describes, in plain language, what data Find My Mahj Game collects, how we use it, how long we keep it, who we share it with, and how you can have it deleted. It is written to support privacy-respecting handling of your data; it is not a claim of compliance with any specific law."
    }
  ],
  "sections": [
    {
      "heading": "What we collect",
      "blocks": [
        {
          "type": "p",
          "text": "**When you create an account:** your email address (used to sign you in with a one-time link, no password), a display name, and optionally a city and state."
        },
        {
          "type": "p",
          "text": "**When you create a player listing:** your city, your skill level, your availability, an optional short bio, and your email address. Your public listing shows your first name and last initial only (for example, \"Sandra M.\"), never your full name, and your email address is never shown publicly."
        },
        {
          "type": "p",
          "text": "**When you create a teacher, organizer, or business listing:** your listing details (name, location, description, links, and similar), plus a private contact email we use to reach you about your listing. This is never shown publicly unless you choose to add a separate public contact email."
        },
        {
          "type": "p",
          "text": "**If you use Mahj Match** (our 18+ matchmaking feature): a timestamp confirming you affirmed you are 18 or older, a timestamp and version marking your consent to matching, your city and state, a travel radius, your availability, your preferred mahjong variant, your skill level, and simple preferences about social style, hosting, and group size. This is only collected if you explicitly opt in. See \"Mahj Match and matching\" below for how this data is used and shared."
        },
        {
          "type": "p",
          "text": "**When we send you an email:** we keep a record of what kind of email it was, its subject line, and whether it was delivered, so we can troubleshoot problems and avoid sending you duplicates. We do not keep a copy of the email's contents in this record."
        },
        {
          "type": "p",
          "text": "**If you block or report another user:** we record that action so it takes effect and so serious reports can be reviewed by a person."
        },
        {
          "type": "p",
          "text": "**Site usage:** we collect a small set of first-party analytics events (things like \"a search was performed\" or \"a listing was viewed\") to understand how the site is used. These events never include free text you typed, your email address, your name, your address, or your phone number; our system automatically strips those out before anything is stored. Any text value we do keep is capped at a short length so it cannot carry identifying detail. We also collect standard server logs (IP address, browser type, pages visited) to keep the site running and secure."
        },
        {
          "type": "p",
          "text": "**Payments:** if you pay for Find My Mahj Premium, Stripe, our payment processor, handles the payment. We never see or store your card number. We keep the limited membership record described in our [Billing Disclosures](/billing-disclosures): your email, Stripe reference IDs for your customer and subscription records, the subscription status, the price you are on, and your renewal date, so we can show you your membership status and keep your listing's benefits current."
        }
      ]
    },
    {
      "heading": "What we never collect or show",
      "blocks": [
        {
          "type": "ul",
          "items": [
            "**Your exact address.** For player listings and Mahj Match, if a description includes a street address, a cross-street, or language describing a private home, our system detects it and either blocks it from going public or removes the specific street-level detail, keeping only the city and a general description like \"the host shares the exact location once you join the group.\" For teacher, organizer, and business listings, a person reviews every submission before it goes public and removes street-level detail that describes a private home. This applies even to well-meaning submissions; we would rather ask you to confirm than publish something that narrows down where you live.",
            "**Your email address, publicly.** It is never shown on your public listing or public profile.",
            "**Your last name, publicly.** Public listings show first name and last initial only.",
            "**Your card number.** We never receive or store it; Stripe does."
          ]
        }
      ]
    },
    {
      "heading": "How we use your information",
      "blocks": [
        {
          "type": "ul",
          "items": [
            "To publish and manage your listing.",
            "To respond to your messages and inquiries.",
            "**Deliver lesson requests.** When you send a lesson request, we email your name, contact details, and message directly to that teacher so they can reply. We keep no copy of your message or contact details, only a delivery record (which teacher, when, and whether the email sent) to spot abuse and confirm delivery.",
            "To send you transactional emails related to your account, your listing, a claim you submitted, or a Mahj Match table (confirmations, status updates, and similar). These are separate from marketing email; see \"Transactional email versus marketing email\" below.",
            "To run Mahj Match, only if you have opted in, matching you with other consenting adults based on the preferences you provided.",
            "To understand how the site is used in aggregate, using the scrubbed analytics described above.",
            "To review reports and enforce blocks, so the platform stays safe to use."
          ]
        },
        {
          "type": "p",
          "text": "We do not sell your information. We do not use your information for advertising, and we do not use cross-site advertising cookies or trackers."
        }
      ]
    },
    {
      "heading": "Mahj Match and matching",
      "blocks": [
        {
          "type": "p",
          "text": "Mahj Match is 18+ only. Before any matching happens on your behalf, we require an explicit affirmation that you are 18 or older and an explicit opt-in to matching, both recorded with a timestamp. You can withdraw from matching at any time."
        },
        {
          "type": "p",
          "text": "When we propose a table to you and other players, each of you sees only first names and the compatibility facts you agreed to share (general area, availability, and similar), not full names, not exact addresses, not contact information. If a table is confirmed, we email everyone and show a table page with first names, day, time, and general area; we never share email addresses or phone numbers, and the group decides how to exchange contact details. The [Matching Community Standards](/matching-standards) describe this in full."
        }
      ]
    },
    {
      "heading": "Transactional email versus marketing email",
      "blocks": [
        {
          "type": "p",
          "text": "We send two different kinds of email, and they work differently:"
        },
        {
          "type": "ul",
          "items": [
            "**Transactional email** covers things the platform cannot function without: signing you in, confirming your listing was received, telling you about a claim decision, or notifying you about a proposed Mahj Match table. You cannot opt out of these while you have an active account and an active listing or match, because they are how we tell you something you asked us to tell you about.",
            "**Marketing email** (our newsletter) is completely separate, sent through Mailchimp, and requires you to sign up for it. You can unsubscribe at any time, and doing so stops marketing email immediately; it does not affect transactional email tied to your account or listing."
          ]
        }
      ]
    },
    {
      "heading": "Cookies and analytics",
      "blocks": [
        {
          "type": "p",
          "text": "We use cookies only as required for the site to function, for example to keep you signed in. We use first-party analytics, described above, to understand aggregate site traffic and improve the directory. Our host, Vercel, also counts page views through Vercel Web Analytics, which uses no cookies and does not identify you. We do not use advertising cookies or cross-site trackers."
        }
      ]
    },
    {
      "heading": "Third-party services",
      "blocks": [
        {
          "type": "p",
          "text": "The site uses Supabase (database and storage), Vercel (hosting, and Vercel Web Analytics, which counts page views without cookies), Resend (transactional email), Mailchimp (marketing newsletter, only if you opt in), and Stripe (payments, only for paid memberships). Each has its own privacy policy. We share with each only the minimum data necessary for it to do its job."
        }
      ]
    },
    {
      "heading": "Blocking and reporting",
      "blocks": [
        {
          "type": "p",
          "text": "If you block another user, we stop showing you to each other in matching. If you report a user or a listing, we record the category of report and any detail you provide. Reports we consider serious (harassment, safety concerns, and similar) are reviewed by a person, not resolved automatically."
        }
      ]
    },
    {
      "heading": "Data deletion and privacy requests",
      "blocks": [
        {
          "type": "p",
          "text": "You can request deletion of your account and its data, or make any other privacy request, from your account page or by emailing hello@findmymahjgame.com. We will acknowledge your request. Requests are generally processed within 30 days, and we confirm completion by email. Different timing may apply where required by applicable law. A person on our team reviews and completes each request; public listing content is removed from view as part of this process."
        }
      ]
    },
    {
      "heading": "Changes to this policy",
      "blocks": [
        {
          "type": "p",
          "text": "We may update this Privacy Policy. Material changes, anything affecting what we collect or how we share it, will be announced clearly."
        }
      ]
    },
    {
      "heading": "Contact",
      "blocks": [
        {
          "type": "p",
          "text": "Questions about this policy: hello@findmymahjgame.com, or use our [contact form](/contact). Find My Mahj Game, Las Vegas, Nevada."
        }
      ]
    }
  ]
};
