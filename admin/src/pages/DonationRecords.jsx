import { useEffect, useMemo, useState, useRef } from "react";
import api, { apiErrorMessage } from '../lib/api';
import {
  FaDownload,
  FaWhatsapp,
  FaDonate,
  FaReceipt,
  FaSearch,
} from "react-icons/fa";
/**
 * jspdf and html2canvas together are the heaviest dependency in the panel and
 * are only needed when an admin actually downloads a receipt. Importing them
 * on demand keeps them out of the initial bundle for every other visit.
 */
const loadPdfTools = async () => {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  return { jsPDF, html2canvas };
};
import DonationReceipt, {
  RECEIPT_WIDTH,
  RECEIPT_HEIGHT,
} from "../components/DonationReceipt";
import MessageDialog from "../components/MessageDialog";
import {
  Badge,
  Button,
  Card,
  CardRow,
  DataTable,
  EmptyState,
  IconButton,
  MobileCard,
  PageHeader,
  PageShell,
  Td,
  Tr,
} from "../components/ui";
import {
  DateRangeFields,
  EMPTY_PERIOD,
  FilterBar,
  FilterField,
  FilterInput,
  FilterSelect,
  PeriodOptions,
  periodRange,
  useDebounced,
} from "../components/Filters";
import Pagination, { useServerPagination } from "../components/Pagination";
import { DonationListSkeleton } from "../components/ui/skeletons";
import {
  useOrganization,
  whatsappHref,
} from "../context/OrganizationContext";

const COLUMNS = [
  { key: "name", label: "Donor" },
  { key: "mobile", label: "Mobile" },
  { key: "amount", label: "Amount" },
  { key: "type", label: "Type" },
  { key: "date", label: "Date" },
  { key: "payment", label: "Payment ID" },
  { key: "actions", label: "Actions", className: "w-32" },
];

const EMPTY_FILTERS = {
  search: "",
  type: "",
  ...EMPTY_PERIOD,
  sort: "newest",
};

// The receipt logo is served from Cloudinary, and html2canvas paints whatever
// the <img> has decoded so far. Wait for every image in the node first,
// otherwise the PDF can come out with a blank logo.
const waitForImages = async (node) => {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })
    )
  );
};

/**
 * The donation records screen.
 *
 * Searching, filtering, sorting and paging are all done by the API — this page
 * holds one page of records at a time. Two things follow from that and are
 * worth knowing when reading the code below:
 *
 *   - The ₹ total in the header is summed by Mongo across everything matching
 *     the filters, and arrives as `totalAmount`. It cannot be added up from the
 *     rows on screen, because those are one page of the answer.
 *   - The type filter's options come from their own endpoint, for the same
 *     reason: the distinct funds are a property of the collection, not of the
 *     twenty-five rows currently loaded.
 */
const DonationRecords = () => {
  const organization = useOrganization();
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  // Distinguishes "no donations at all" from "nothing matches these filters".
  const [recordsEmpty, setRecordsEmpty] = useState(false);
  const [dialog, setDialog] = useState(null);
  // The donation currently being rendered off-screen for PDF export.
  const [pdfDonation, setPdfDonation] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const receiptRef = useRef();

  const { page, rowsPerPage, resetPage, paginationProps } = useServerPagination(total);

  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const filtersActive = Object.keys(EMPTY_FILTERS).some(
    (key) => filters[key] !== EMPTY_FILTERS[key]
  );

  // Typing is not a query. Everything else applies as soon as it is picked.
  const search = useDebounced(filters.search);
  const { type, period, from, to, sort } = filters;

  // A narrowed list should always be read from the top — but only when the
  // filters change, not when the page does.
  useEffect(() => {
    resetPage();
  }, [search, type, period, from, to, sort, resetPage]);

  // The funds present in the records, whatever the donate form offers today —
  // a retired fund must stay filterable. Loaded once; the set only changes when
  // a donation of a brand-new type arrives.
  useEffect(() => {
    api
      .get('/donations/types')
      .then((res) => setTypes(res.data))
      // A missing filter dropdown is not worth a dialog over: the records
      // themselves still load, and every other filter still works.
      .catch((err) => console.error("Error fetching donation types:", err));
  }, []);

  // Responses can arrive out of order once a search is being typed. Only the
  // newest request is allowed to write to state.
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);

    const range = periodRange({ period, from, to });

    api
      .get('/donations', {
        params: {
          page,
          limit: rowsPerPage,
          sort,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(type ? { type } : {}),
          ...(range.from ? { from: range.from } : {}),
          ...(range.to ? { to: range.to } : {}),
        },
      })
      .then((res) => {
        if (id !== requestId.current) return;
        setDonations(res.data.items);
        setTotal(res.data.total);
        setTotalAmount(res.data.totalAmount || 0);
        if (!filtersActive && res.data.total === 0) setRecordsEmpty(true);
        else if (res.data.total > 0) setRecordsEmpty(false);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        console.error("Error fetching donations:", err);
        setDonations([]);
        setDialog({
          type: "error",
          title: "Could not load donations",
          message: "We were unable to fetch the donation records. Please try again.",
          details: apiErrorMessage(err, err.message),
        });
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
    // `filtersActive` is derived from the filters already listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type, period, from, to, sort, page, rowsPerPage]);

  // Rendering the receipt is a state change, so the download runs from an
  // effect once the off-screen node for `pdfDonation` is actually in the DOM.
  useEffect(() => {
    if (!pdfDonation) return;
    let cancelled = false;

    const run = async () => {
      // Give React/the browser a frame to paint the off-screen receipt.
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );
      if (cancelled || !receiptRef.current) return;
      await generatePDF(pdfDonation, receiptRef.current);
      if (!cancelled) setPdfDonation(null);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [pdfDonation]);

  const generatePDF = async (donation, node) => {
    try {
      const { jsPDF, html2canvas } = await loadPdfTools();

      await waitForImages(node);

      // Capture at 3x so the A4 page prints crisply, then map it 1:1 onto the page.
      const canvas = await html2canvas(node, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: RECEIPT_WIDTH,
        height: RECEIPT_HEIGHT,
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight(),
        undefined,
        "FAST"
      );
      const safeName = (donation.name || "donor")
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "");
      pdf.save(`donation_receipt_${safeName}.pdf`);
    } catch (err) {
      console.error("Failed to generate receipt:", err);
      setDialog({
        type: "error",
        title: "Could not create the receipt",
        message: "The PDF could not be generated. Please try again.",
        details: err?.message,
      });
    }
  };

  const handleWhatsApp = (donation) => {
    if (!donation) return;
    const lines = [
      `Hello ${donation.name},`,
      `Thank you for your donation of ${donation.amount} (${donation.type}).`,
    ];
    if (organization.organizationName) {
      lines.push(`Organization: ${organization.organizationName}`);
    }
    if (organization.contactNumber) {
      lines.push(`Contact: ${organization.contactNumber}`);
    }
    const url = whatsappHref(donation.mobile, lines.join("\n"));
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  // Sums everything the filters match, not the rows on screen — the total comes
  // from the server for exactly that reason.
  const headerMeta = useMemo(() => {
    if (loading || recordsEmpty) return undefined;
    return `₹${totalAmount.toLocaleString("en-IN")} received in total`;
  }, [loading, recordsEmpty, totalAmount]);

  // The same count line every list card in the panel carries.
  const cardDescription = loading
    ? "Loading…"
    : filtersActive
    ? `${total} ${
        total === 1 ? "donation matches" : "donations match"
      } the filters.`
    : `${total} ${total === 1 ? "donation" : "donations"} received.`;

  return (
    <PageShell>
      <PageHeader
        title="Donation Records"
        description="Every donation received through the website. Download a receipt as a PDF or thank the donor on WhatsApp."
        meta={headerMeta}
      />

      <Card icon={FaDonate} title="All Donations" description={cardDescription}>
        {recordsEmpty ? (
          <EmptyState
            icon={FaReceipt}
            title="No donations yet"
            message="Donations made through the website's Donate page will be listed here."
          />
        ) : (
          <>
            <FilterBar
              onReset={() => setFilters(EMPTY_FILTERS)}
              canReset={filtersActive}
            >
              <FilterField label="Search Donor" htmlFor="donation-search">
                <FilterInput
                  id="donation-search"
                  placeholder="Name / Mobile / Payment ID"
                  value={filters.search}
                  onChange={(e) => setFilter("search", e.target.value)}
                />
              </FilterField>
              <FilterField label="Donation Type" htmlFor="donation-type">
                <FilterSelect
                  id="donation-type"
                  value={filters.type}
                  onChange={(e) => setFilter("type", e.target.value)}
                >
                  <option value="">All Types</option>
                  {types.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>
              <FilterField label="Date" htmlFor="donation-period">
                <FilterSelect
                  id="donation-period"
                  value={filters.period}
                  onChange={(e) =>
                    // Leaving "Custom" drops any dates that were picked.
                    setFilters((current) => ({
                      ...current,
                      ...EMPTY_PERIOD,
                      period: e.target.value,
                    }))
                  }
                >
                  <PeriodOptions />
                </FilterSelect>
              </FilterField>
              {filters.period === "custom" &&
                DateRangeFields({
                  idPrefix: "donation",
                  from: filters.from,
                  to: filters.to,
                  onChange: setFilter,
                })}
              <FilterField label="Sort By" htmlFor="donation-sort">
                <FilterSelect
                  id="donation-sort"
                  value={filters.sort}
                  onChange={(e) => setFilter("sort", e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amountDesc">Amount (High–Low)</option>
                  <option value="amountAsc">Amount (Low–High)</option>
                </FilterSelect>
              </FilterField>
            </FilterBar>

            {loading ? (
              <DonationListSkeleton />
            ) : total === 0 ? (
              <EmptyState
                icon={FaSearch}
                title="No matching donations"
                message="No donation matches these filters. Try a different search, type or date range."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                {/* Table for desktop / laptop */}
                <div className="hidden md:block">
                  <DataTable columns={COLUMNS}>
                    {donations.map((d) => (
                      <Tr key={d._id}>
                        <Td className="font-medium text-gray-900">{d.name}</Td>
                        <Td className="whitespace-nowrap">{d.mobile}</Td>
                        <Td className="whitespace-nowrap font-semibold text-gray-900">
                          ₹{Number(d.amount).toLocaleString("en-IN")}
                        </Td>
                        <Td>
                          <Badge tone="blue">{d.type}</Badge>
                        </Td>
                        <Td className="whitespace-nowrap text-gray-500">
                          {new Date(d.createdAt).toLocaleString()}
                        </Td>
                        <Td className="font-mono text-xs">
                          {d.razorpayPaymentId || (
                            <span className="text-gray-400">—</span>
                          )}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            {/* Building the PDF takes a moment; the row says so
                                the same way the mobile card does. */}
                            <IconButton
                              icon={FaDownload}
                              label="Download donation PDF"
                              onClick={() => setPdfDonation(d)}
                              loading={pdfDonation?._id === d._id}
                              disabled={Boolean(pdfDonation)}
                            />
                            <IconButton
                              icon={FaWhatsapp}
                              label="Send on WhatsApp"
                              variant="green"
                              onClick={() => handleWhatsApp(d)}
                            />
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </DataTable>
                </div>

                {/* Card view for mobile */}
                <div className="grid gap-4 md:hidden">
                  {donations.map((d) => (
                    <MobileCard key={d._id}>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-gray-900">
                          {d.name}
                        </h3>
                        <span className="flex-shrink-0 text-base font-semibold text-gray-900">
                          ₹{Number(d.amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <CardRow label="Mobile">{d.mobile}</CardRow>
                        <CardRow label="Type">
                          <Badge tone="blue">{d.type}</Badge>
                        </CardRow>
                        <CardRow label="Date">
                          {new Date(d.createdAt).toLocaleString()}
                        </CardRow>
                        <CardRow label="Payment ID">
                          <span className="break-all font-mono text-xs">
                            {d.razorpayPaymentId || "—"}
                          </span>
                        </CardRow>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FaDownload}
                          fullWidth
                          loading={pdfDonation?._id === d._id}
                          disabled={Boolean(pdfDonation)}
                          onClick={() => setPdfDonation(d)}
                        >
                          Receipt
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          icon={FaWhatsapp}
                          fullWidth
                          onClick={() => handleWhatsApp(d)}
                        >
                          WhatsApp
                        </Button>
                      </div>
                    </MobileCard>
                  ))}
                </div>

                <Pagination {...paginationProps} />
              </>
            )}
          </>
        )}
      </Card>

      {/* Off-screen, unscaled copy — this is the node html2canvas exports. */}
      {pdfDonation && (
        <div
          style={{ position: "fixed", top: 0, left: -10000, zIndex: -1 }}
          aria-hidden="true"
        >
          <DonationReceipt
            ref={receiptRef}
            donation={pdfDonation}
            organization={organization}
          />
        </div>
      )}

      <MessageDialog
        open={Boolean(dialog)}
        type={dialog?.type}
        title={dialog?.title}
        message={dialog?.message}
        details={dialog?.details}
        onClose={() => setDialog(null)}
      />
    </PageShell>
  );
};

export default DonationRecords;
