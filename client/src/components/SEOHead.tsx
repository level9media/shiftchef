import { Helmet } from "react-helmet-async";

const SITE_URL = "https://shiftchef.co";
const SITE_NAME = "ShiftChef";
const DEFAULT_TITLE = "ShiftChef — Find Shifts. Hire Fast.";
const DEFAULT_DESCRIPTION =
  "ShiftChef is Austin's on-demand hospitality staffing marketplace. Restaurants post shifts, verified kitchen workers apply in minutes. Real-time job feed, secure payments, and 1099 contractor agreements.";
const DEFAULT_OG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663450394445/5XtEwxhSav9aHUudDTD5pa/og-image-eFyYHYLVAGr6SD6jT92hzB.png";

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  canonicalPath?: string;
  noIndex?: boolean;
  jsonLd?: object;
}

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  canonicalPath,
  noIndex = false,
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@shiftchef" />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

// ─── Pre-built JSON-LD schemas ────────────────────────────────────────────────

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ShiftChef",
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Austin",
      addressRegion: "TX",
      addressCountry: "US",
    },
    sameAs: [
      "https://twitter.com/shiftchef",
      "https://www.linkedin.com/company/shiftchef",
    ],
  };
}

export function buildJobPostingSchema(job: {
  id: number;
  role: string;
  restaurantName?: string | null;
  description?: string | null;
  payRate: string | number;
  startTime: number;
  endTime: number;
  city?: string | null;
  location?: string | null;
}) {
  const roleLabel = job.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const startDate = new Date(job.startTime).toISOString();
  const endDate = new Date(job.endTime).toISOString();
  const hourlyRate = parseFloat(String(job.payRate));
  const hours = (job.endTime - job.startTime) / 3600000;
  const totalPay = (hourlyRate * hours).toFixed(2);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: `${roleLabel}${job.restaurantName ? ` at ${job.restaurantName}` : ""}`,
    description: job.description || `${roleLabel} shift available on ShiftChef. Apply now.`,
    datePosted: new Date().toISOString(),
    validThrough: endDate,
    employmentType: "TEMPORARY",
    hiringOrganization: {
      "@type": "Organization",
      name: job.restaurantName || "ShiftChef Employer",
      sameAs: SITE_URL,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: job.location || "",
        addressLocality: (job.city || "Austin").split(",")[0].trim(),
        addressRegion: "TX",
        addressCountry: "US",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        value: hourlyRate,
        unitText: "HOUR",
      },
    },
    totalPayRange: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: totalPay,
    },
    workHours: `${startDate} to ${endDate}`,
    url: `${SITE_URL}/jobs/${job.id}`,
    jobLocationType: "TELECOMMUTE_NOT_ALLOWED",
    applicantLocationRequirements: {
      "@type": "City",
      name: job.city || "Austin, TX",
    },
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/feed?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
