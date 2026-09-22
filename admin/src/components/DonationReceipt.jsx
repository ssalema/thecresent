import { forwardRef } from "react";
import {
  LuUser,
  LuFileText,
  LuCheck,
  LuReceiptText,
  LuCalendarDays,
  LuTag,
  LuIndianRupee,
  LuHandHeart,
} from "react-icons/lu";
import { EMPTY_ORGANIZATION, initialsOf } from "../context/OrganizationContext";

// A4 at 96dpi. The PDF is rendered from this exact box, so it always fits one page.
export const RECEIPT_WIDTH = 794;
export const RECEIPT_HEIGHT = 1123;

const NAVY = "#16233f";
const INK = "#1f2b45";
const MUTED = "#7b8798";
const LINE = "#edf0f5";
const ZEBRA = "#fafbfc";
// Flat blend of white at ~12% over NAVY. The icon discs on the navy strip use
// it instead of an rgba fill, which html2canvas composites unreliably.
const NAVY_TINT = "#2c3853";

// Teal is the document's accent — icon badges, eyebrows and the acknowledgement
// edge — over navy for the solid bands. Green is reserved for the status pill,
// where it carries meaning rather than decoration.
const TEAL = "#2f7f8c";
const TEAL_TINT = "#e6f1f3";
const TEAL_WASH = "#f7fbfc";
const GREEN = "#16a34a";
const GREEN_DARK = "#15803d";
const GREEN_TINT = "#dcfce7";

// Inter is loaded in index.css (400/500/600/700) and is the family used across
// the panel's printed documents, so every weight below resolves to a real cut.
const FONT = "'Inter', 'Segoe UI', Arial, Helvetica, sans-serif";

// Shared type scale — the whole document is built from these four styles.
const EYEBROW = { fontSize: 9, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase" };
const LABEL = { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" };
const VALUE = { fontSize: 14, fontWeight: 700, letterSpacing: "0.01em" };
const BODY = { fontSize: 11, fontWeight: 400, lineHeight: 1.6 };

// Card shell shared by every panel, so all of them read as one family.
const CARD = {
  border: `1px solid ${LINE}`,
  borderRadius: 14,
  background: "#ffffff",
  boxShadow: "0 1px 3px rgba(16,24,40,0.045)",
  overflow: "hidden",
};

// Label column width, shared by every detail table so their values line up.
const LABEL_WIDTH = 220;

// Diameter of the icon discs in the reference strip.
const STRIP_DISC = 34;

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${formatDate(value)}, ${time}`;
};

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigits = (n) =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;

const threeDigits = (n) =>
  `${n > 99 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " : ""}` : ""}${
    n % 100 ? twoDigits(n % 100) : ""
  }`;

// Indian numbering (crore / lakh / thousand) — the convention donors here expect.
const amountInWords = (value) => {
  const total = Math.round((Number(value) || 0) * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  if (!rupees && !paise) return "Zero Rupees Only";

  const words = [
    [Math.floor(rupees / 10000000), "Crore"],
    [Math.floor((rupees % 10000000) / 100000), "Lakh"],
    [Math.floor((rupees % 100000) / 1000), "Thousand"],
    [rupees % 1000, ""],
  ]
    .filter(([n]) => n > 0)
    .map(([n, unit]) => `${threeDigits(n)}${unit ? ` ${unit}` : ""}`)
    .join(" ");

  const rupeePart = rupees ? `${words} Rupees` : "";
  const paisePart = paise ? `${rupees ? " and " : ""}${twoDigits(paise)} Paise` : "";
  return `${rupeePart}${paisePart} Only`;
};

/**
 * Human-readable receipt number, derived from the donation itself so the same
 * donation always prints the same number — no counter to keep in sync.
 */
const receiptNumber = (donation) => {
  const date = donation.createdAt ? new Date(donation.createdAt) : new Date();
  const stamp = Number.isNaN(date.getTime())
    ? "0000-00"
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const seed = String(donation._id || donation.razorpayPaymentId || donation.razorpayOrderId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0");
  return `DR-${stamp}-${seed}`;
};

/** Round tinted badge that opens each card, and the acknowledgement block. */
const IconBadge = ({ icon: Icon, size = 40 }) => (
  <div
    style={{
      width: size,
      height: size,
      minWidth: size,
      borderRadius: "50%",
      background: TEAL_TINT,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Icon size={Math.round(size * 0.48)} strokeWidth={1.75} color={TEAL} />
  </div>
);

/**
 * Status pill. Height, icon and line box are tied to one number so the tick and
 * the word share the pill's centre: with a line box equal to the pill height,
 * the capitals centre at exactly half of it, which is where the flex row also
 * puts the tick. Nothing here depends on leading, which html2canvas and the
 * browser distribute differently.
 */
// Badge geometry. The badge has NO fixed height and NO leading: its height is
// the word's own line box plus equal padding above and below, which is the one
// arrangement that centres text without depending on how a renderer distributes
// leading. That matters because html2canvas positions a text run from its
// natural baseline and disregards a tall `line-height` — so every earlier
// version, which centred the word in a 26px line box, drew it ~6px lower in the
// PDF than on screen, leaving it low in the pill while the disc stayed put.
//
//   height   = 13 (line) + 6 + 6 (padding) = 25
//   centre   = 12.5, which is both the box centre and, for Inter, the centre of
//              the capitals — ascent - cap/2 (6.66) equals half the line box
//   the disc is pinned to that centre with a percentage offset, so it needs no
//   font metric of its own
const BADGE_TYPE = 11;
const BADGE_LINE = 13;
const BADGE_PAD_Y = 6;
const BADGE_DISC = 14;
const BADGE_INSET = 5;
const BADGE_GAP = 6;

const StatusChip = ({ status, paid }) => (
  <span
    style={{
      position: "relative",
      display: "inline-block",
      padding: `${BADGE_PAD_Y}px ${BADGE_INSET}px ${BADGE_PAD_Y}px ${
        BADGE_INSET + BADGE_DISC + BADGE_GAP
      }px`,
      borderRadius: (BADGE_LINE + BADGE_PAD_Y * 2) / 2,
      background: paid ? GREEN_TINT : "#fde8e8",
      ...LABEL,
      fontSize: BADGE_TYPE,
      fontWeight: 700,
      letterSpacing: "0.1em",
      lineHeight: `${BADGE_LINE}px`,
      color: paid ? GREEN_DARK : "#a33131",
      whiteSpace: "nowrap",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: "50%",
        left: BADGE_INSET,
        marginTop: -BADGE_DISC / 2,
        width: BADGE_DISC,
        height: BADGE_DISC,
        borderRadius: "50%",
        background: paid ? GREEN : "#c23b3b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LuCheck size={9} strokeWidth={3.5} color="#ffffff" />
    </span>
    {/* Tracking leaves a trailing space after the last letter; pulling it back
        makes the right inset print as wide as the left one, not 1px wider. */}
    <span style={{ marginRight: "-0.1em" }}>{String(status).toUpperCase()}</span>
  </span>
);

/** Card header: tinted icon badge beside the section name. */
const CardHeader = ({ icon, children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "12px 18px",
      borderBottom: `1px solid ${LINE}`,
    }}
  >
    <IconBadge icon={icon} />
    <span
      style={{
        ...LABEL,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.1em",
        lineHeight: 1.4,
        marginLeft: 14,
        color: NAVY,
      }}
    >
      {children}
    </span>
  </div>
);

/**
 * One line of a detail table. Label and value share a single flex line aligned
 * on the baseline, so the 10px label and the 14px value sit on the same rule
 * rather than each centring in its own box. The column divider is positioned
 * separately for that reason — it still spans the full row height.
 *
 * `centered` switches the row to centre alignment for values that are a box
 * rather than text (the status pill): a baseline is meaningless there, so the
 * pill is centred against the label instead.
 */
const Field = ({ label, value, zebra, last, centered }) => (
  <div
    style={{
      position: "relative",
      display: "flex",
      alignItems: centered ? "center" : "baseline",
      padding: centered ? "10px 0" : "12px 0",
      background: zebra ? ZEBRA : "#ffffff",
      borderBottom: last ? "none" : `1px solid ${LINE}`,
    }}
  >
    <div
      style={{
        flex: `0 0 ${LABEL_WIDTH}px`,
        boxSizing: "border-box",
        padding: "0 16px 0 18px",
        ...LABEL,
        lineHeight: 1.4,
        color: MUTED,
      }}
    >
      {label}
    </div>
    <span
      style={{ position: "absolute", top: 0, bottom: 0, left: LABEL_WIDTH, width: 1, background: LINE }}
    />
    <div
      style={{
        flex: 1,
        boxSizing: "border-box",
        padding: "0 18px",
        display: centered ? "flex" : "block",
        alignItems: "center",
        ...VALUE,
        lineHeight: 1.4,
        color: NAVY,
        wordBreak: "break-word",
      }}
    >
      {value}
    </div>
  </div>
);

/**
 * One cell of the reference strip: an icon disc stacked over the label and its
 * value, centred in an equal quarter of the strip. The four cells carry the
 * facts a donor looks up first, so they lead the document as a row of tiles
 * rather than a table — the columns are read across, never down.
 */
const StripCell = ({ icon: Icon, label, value }) => (
  <div style={{ flex: 1, boxSizing: "border-box", padding: "0 8px", textAlign: "center" }}>
    <div
      style={{
        width: STRIP_DISC,
        height: STRIP_DISC,
        margin: "0 auto",
        borderRadius: "50%",
        background: NAVY_TINT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={17} strokeWidth={1.75} color="#ffffff" />
    </div>
    <div style={{ ...LABEL, fontSize: 9, lineHeight: 1.4, marginTop: 9, color: "#9fb0c9" }}>
      {label}
    </div>
    <div style={{ ...VALUE, fontSize: 13, lineHeight: 1.4, marginTop: 4, color: "#ffffff" }}>
      {value}
    </div>
  </div>
);

/**
 * The letterhead mark: the uploaded logo, or the organization's initials drawn
 * in the document's own navy when none has been uploaded.
 *
 * No image is bundled as a fallback — a receipt is a document a donor keeps, so
 * it must never carry a mark belonging to some other organization.
 */
const Mark = ({ url, name, size, opacity = 1 }) =>
  url ? (
    <img
      src={url}
      alt={name || ""}
      crossOrigin="anonymous"
      style={{ width: size, display: "block", opacity }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `${Math.max(2, Math.round(size * 0.02))}px solid ${NAVY}`,
        borderRadius: Math.round(size * 0.1),
        color: NAVY,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: Math.round(size * 0.34),
        letterSpacing: "0.06em",
        opacity,
      }}
    >
      {initialsOf(name)}
    </div>
  );

/**
 * Print-ready donation receipt. Rendered to PDF via html2canvas, so every style
 * is inline and hex-coded — Tailwind utilities and modern color functions are
 * deliberately avoided here because html2canvas cannot parse them.
 *
 * Typography follows the same Inter scale as the payroll documents: tracked
 * uppercase labels over bold values, so the two read as one document family.
 *
 * Every organization detail printed here comes from Organization Settings via
 * the `organization` prop, so editing it in the admin panel changes the next
 * receipt with no code change.
 */
const DonationReceipt = forwardRef(({ donation, organization }, ref) => {
  if (!donation) return null;

  const org = organization || EMPTY_ORGANIZATION;
  const logo = org.logo?.url || "";
  const status = donation.status || "paid";
  const isPaid = status === "paid";
  const website = org.websiteUrl ? org.websiteUrl.replace(/^https?:\/\//, "") : "";
  const receiptNo = receiptNumber(donation);
  const purpose = donation.type || "General Donation";

  return (
    <div
      ref={ref}
      style={{
        width: RECEIPT_WIDTH,
        height: RECEIPT_HEIGHT,
        boxSizing: "border-box",
        background: "#ffffff",
        fontFamily: FONT,
        color: INK,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Watermark */}
      <div style={{ position: "absolute", top: 500, left: 247 }}>
        <Mark url={logo} name={org.organizationName} size={300} opacity={0.03} />
      </div>

      {/* ---------- Letterhead ---------- */}
      <div
        style={{
          position: "relative",
          padding: "24px 34px 16px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Mark url={logo} name={org.organizationName} size={96} />
        <span style={{ width: 1, height: 58, background: LINE, margin: "0 24px" }} />

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ ...EYEBROW, color: TEAL }}>Official Acknowledgement</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: NAVY,
              lineHeight: 1.1,
            }}
          >
            DONATION RECEIPT
          </div>
          <div style={{ ...LABEL, fontSize: 9, marginTop: 8, color: MUTED }}>
            {org.organizationName}
          </div>
        </div>

        <span style={{ width: 1, height: 58, background: LINE, margin: "0 24px" }} />
        <div style={{ width: 178, textAlign: "right", ...BODY, fontSize: 10, color: MUTED }}>
          {org.address && <div>{org.address}</div>}
          {org.contactEmail && <div>{org.contactEmail}</div>}
          {org.contactNumber && <div>{org.contactNumber}</div>}
          {website && <div>{website}</div>}
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div
        style={{
          position: "relative",
          flex: 1,
          boxSizing: "border-box",
          padding: "0 34px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Reference strip */}
        <div
          style={{
            ...CARD,
            display: "flex",
            alignItems: "flex-start",
            padding: "16px 10px",
            background: NAVY,
            border: "none",
          }}
        >
          <StripCell icon={LuReceiptText} label="Receipt No." value={receiptNo} />
          <StripCell
            icon={LuCalendarDays}
            label="Received On"
            value={formatDate(donation.createdAt)}
          />
          <StripCell icon={LuTag} label="Purpose" value={purpose} />
          <StripCell
            icon={LuIndianRupee}
            label="Amount"
            value={`₹${formatAmount(donation.amount)}`}
          />
        </div>

        {/* Acknowledgement */}
        <div
          style={{
            ...CARD,
            marginTop: 10,
            borderColor: TEAL_TINT,
            background: TEAL_WASH,
            display: "flex",
            alignItems: "center",
            padding: "14px 18px",
          }}
        >
          <IconBadge icon={LuHandHeart} size={42} />
          <div style={{ flex: 1, marginLeft: 16, fontSize: 12.5, lineHeight: 1.7, color: INK }}>
            Received with sincere thanks from{" "}
            <span style={{ fontWeight: 700, color: NAVY }}>{donation.name || "—"}</span> the sum of{" "}
            <span style={{ fontWeight: 700, color: NAVY }}>₹{formatAmount(donation.amount)}</span> (
            {amountInWords(donation.amount)}) towards{" "}
            <span style={{ fontWeight: 700, color: NAVY }}>{purpose}</span>.
          </div>
        </div>

        {/* Donor details */}
        <div style={{ ...CARD, marginTop: 12 }}>
          <CardHeader icon={LuUser}>Donor Details</CardHeader>
          <Field label="Donor Name" value={donation.name || "—"} />
          <Field label="Contact Number" value={donation.mobile || "—"} zebra last />
        </div>

        {/* Contribution details */}
        <div style={{ ...CARD, marginTop: 12 }}>
          <CardHeader icon={LuFileText}>Contribution Details</CardHeader>
          <Field label="Purpose / Fund" value={purpose} />
          <Field label="Payment Mode" value="Online — Razorpay" zebra />
          <Field label="Transaction ID" value={donation.razorpayPaymentId || "—"} />
          <Field label="Order Reference" value={donation.razorpayOrderId || "—"} zebra />
          <Field label="Received On" value={formatDateTime(donation.createdAt)} />
          <Field
            label="Payment Status"
            value={<StatusChip status={status} paid={isPaid} />}
            zebra
            centered
            last
          />
        </div>

        {/* Total */}
        <div style={{ ...CARD, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", background: NAVY }}>
            <div style={{ flex: 1, padding: "14px 18px" }}>
              <div style={{ ...LABEL, fontSize: 9, color: "#93a3bd" }}>Total Amount Received</div>
              <div style={{ ...BODY, fontSize: 10, marginTop: 4, color: "#c6d3e4" }}>
                Indian Rupees
              </div>
            </div>
            <div style={{ padding: "14px 20px", fontSize: 26, fontWeight: 700, color: "#ffffff" }}>
              ₹{formatAmount(donation.amount)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", padding: "11px 18px", background: ZEBRA }}>
            <span style={{ ...LABEL, fontSize: 9, color: MUTED, marginRight: 10 }}>In Words</span>
            <span style={{ ...VALUE, fontSize: 12, color: NAVY }}>
              {amountInWords(donation.amount)}
            </span>
          </div>
        </div>

        {/* Closing note */}
        <div style={{ marginTop: "auto", marginBottom: 14, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ width: 90, height: 1, background: LINE }} />
            <span style={{ ...EYEBROW, color: TEAL, margin: "0 14px" }}>With Gratitude</span>
            <span style={{ width: 90, height: 1, background: LINE }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.01em", color: NAVY }}>
            Thank you for your contribution.
          </div>
          <div style={{ ...BODY, fontSize: 12, marginTop: 6, color: INK }}>
            We appreciate your kindness and support.
            <br />
            Together, we can make a difference.
          </div>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <div
        style={{
          background: NAVY,
          padding: "12px 34px",
          textAlign: "center",
          ...BODY,
          fontSize: 9,
          letterSpacing: "0.04em",
          color: "#c6d3e4",
        }}
      >
        This is a computer generated receipt and is valid without any physical signature.
        Please retain it for your records.{website ? ` · ${website}` : ""}
      </div>
    </div>
  );
});

export default DonationReceipt;
