import type { Metadata } from "next";
import { AD_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Advertiser Terms",
};

export default function AdvertiserTermsPage() {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Legal</div>
        <h1>Advertiser Terms</h1>
        <p>Last updated: April 2026</p>
      </div>

      <div className="page-body">
        <div className="highlight-box">
          <p>
            These Advertiser Terms apply to all paid listings and advertising placements on
            findmymahjgame.com. By submitting payment you agree to these terms.
          </p>
        </div>

        <h2>Approval Process</h2>
        <p>
          All advertising inquiries are reviewed before going live. We reserve the right to decline
          any listing or advertisement for any reason. Approval is not guaranteed and payment should
          only be submitted after written confirmation of approval.
        </p>

        <h2>Payments</h2>
        <ul>
          <li>All fees are in USD and due upon invoice</li>
          <li>Monthly subscriptions renew automatically until cancelled</li>
          <li>Annual plans are paid in full upfront</li>
          <li>
            We accept major credit cards and other payment methods as specified in your invoice
          </li>
        </ul>

        <h2>Cancellation &mdash; Monthly Plans</h2>
        <ul>
          <li>
            Monthly plans may be cancelled with 30 days written notice to{" "}
            <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a>
          </li>
          <li>Your listing remains active through the end of the current paid period</li>
          <li>No partial refunds for the current month</li>
        </ul>

        <h2>Cancellation &mdash; Annual Plans</h2>
        <ul>
          <li>Annual plans are non-refundable after 30 days from the start date</li>
          <li>
            Cancellations within 30 days of purchase receive a prorated refund for unused months
          </li>
          <li>After 30 days, annual plans run to completion with no refund</li>
        </ul>

        <h2>Content Standards</h2>
        <ul>
          <li>All listing content must be accurate and related to mahjong</li>
          <li>We reserve the right to edit listings for accuracy, grammar or length</li>
          <li>
            Listings may not contain misleading claims, inappropriate content, or competitor
            disparagement
          </li>
          <li>Images must be high quality and relevant to your business</li>
        </ul>

        <h2>Advertiser Responsibilities</h2>
        <ul>
          <li>You are responsible for keeping your listing information current</li>
          <li>
            Notify us promptly of any changes to hours, location, pricing or contact info
          </li>
          <li>You are responsible for honoring any offers or claims made in your listing</li>
        </ul>

        <h2>Limitation of Liability</h2>
        <p>
          Find My Mahj Game does not guarantee any specific number of views, clicks or conversions
          from your listing. We are a directory platform and cannot control user behavior.
          Advertising fees are for placement, not for guaranteed results.
        </p>

        <h2>Termination by Us</h2>
        <p>
          We reserve the right to remove any listing and terminate any advertiser relationship if
          terms are violated, content is found to be inaccurate or inappropriate, or if we determine
          the listing is not a good fit for our platform. In such cases, a prorated refund for unused
          time will be provided.
        </p>

        <h2>Contact</h2>
        <p>
          Advertising questions: <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a>
        </p>
      </div>
    </>
  );
}
