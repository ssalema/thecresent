import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import MessageDialog from '../components/MessageDialog';
import api, { apiErrorMessage } from '../lib/api';
import {
  FaEye,
  FaTrash,
  FaReply,
  FaInbox,
  FaEnvelopeOpenText,
  FaSearch,
} from 'react-icons/fa';
import {
  Button,
  Card,
  CardRow,
  DataTable,
  Detail,
  EmptyState,
  IconButton,
  MobileCard,
  Modal,
  PageHeader,
  PageShell,
  Td,
  Tr,
} from '../components/ui';
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
} from '../components/Filters';
import Pagination, { useServerPagination } from '../components/Pagination';
import { MessageListSkeleton } from '../components/ui/skeletons';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'date', label: 'Date & Time' },
  { key: 'actions', label: 'Actions', className: 'w-40' },
];

const formatDate = (value) => new Date(value).toLocaleString();

const EMPTY_FILTERS = { search: '', ...EMPTY_PERIOD, sort: 'newest' };

/**
 * The inbox.
 *
 * Searching, filtering, sorting and paging are all done by the API — this page
 * holds one page of messages at a time and nothing more. It used to download
 * every message the charity had ever received and do all four in the browser,
 * which is fine at a hundred rows and is not fine at fifty thousand: the inbox
 * is fed by an unauthenticated public form, so it grows with traffic rather
 * than with anything an admin does.
 */
const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // Distinguishes "the inbox is empty" from "nothing matches these filters".
  // Only a fetch with no filters at all can answer that, so it is remembered
  // from the first one.
  const [inboxEmpty, setInboxEmpty] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Bumped to re-run the current query after a delete, so the page refills from
  // the server instead of shrinking by one row.
  const [refreshToken, setRefreshToken] = useState(0);

  const { page, rowsPerPage, resetPage, paginationProps } = useServerPagination(total);

  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const filtersActive = Object.keys(EMPTY_FILTERS).some(
    (key) => filters[key] !== EMPTY_FILTERS[key]
  );

  // Typing is not a query. Everything else applies as soon as it is picked.
  const search = useDebounced(filters.search);
  const { period, from, to, sort } = filters;

  // A narrowed list should always be read from the top — but only when the
  // filters change, not when the page does.
  useEffect(() => {
    resetPage();
  }, [search, period, from, to, sort, resetPage]);

  // Responses can arrive out of order once a search is being typed. Only the
  // newest request is allowed to write to state; anything older is stale by
  // definition and would flash the wrong rows.
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);

    const range = periodRange({ period, from, to });

    api
      .get('/contacts', {
        params: {
          page,
          limit: rowsPerPage,
          sort,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(range.from ? { from: range.from } : {}),
          ...(range.to ? { to: range.to } : {}),
        },
      })
      .then((res) => {
        if (id !== requestId.current) return;
        setMessages(res.data.items);
        setTotal(res.data.total);
        // An unfiltered page-one read that comes back empty is the only proof
        // that there is nothing here at all.
        if (!filtersActive && res.data.total === 0) setInboxEmpty(true);
        else if (res.data.total > 0) setInboxEmpty(false);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        console.error(err);
        setMessages([]);
        setDialog({
          type: 'error',
          title: 'Could not load messages',
          message: 'We were unable to fetch your inbox. Please try again.',
          details: apiErrorMessage(err, err.message),
        });
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
    // `filtersActive` is derived from the filters already listed here, so it is
    // deliberately not a dependency — including it would not change when this
    // runs, only how often it is re-created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, period, from, to, sort, page, rowsPerPage, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  const confirmDelete = async () => {
    if (!messageToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/contacts/${messageToDelete._id}`);
      // Close the detail view too if the deleted message was open in it.
      setSelectedMessage((cur) => (cur?._id === messageToDelete._id ? null : cur));
      setMessageToDelete(null);
      // Refetch rather than splice: the row that moves up onto this page comes
      // from the server, so the page stays full and the count stays honest.
      refresh();
    } catch (err) {
      console.error(err);
      setMessageToDelete(null);
      setDialog({
        type: 'error',
        title: 'Could not delete message',
        message: 'The message was not deleted. Please try again.',
        details: apiErrorMessage(err, err.message),
      });
    } finally {
      setDeleting(false);
    }
  };

  // The address is typed by whoever submitted the contact form, so it is
  // encoded rather than interpolated: the server's email rule allows `&` and
  // `#`, which unescaped would end the `to` parameter and let a submitter append
  // their own — a compose window pre-filled with someone else's subject, body or
  // bcc, opened by the admin and sent from the charity's own mailbox.
  const handleReply = (email) => {
    const to = encodeURIComponent(String(email ?? '').trim());
    if (!to) return;
    window.open(
      `https://mail.google.com/mail/?view=cm&to=${to}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const cardDescription = loading
    ? 'Loading…'
    : filtersActive
    ? `${total} ${total === 1 ? 'message matches' : 'messages match'} the filters.`
    : `${total} ${total === 1 ? 'message' : 'messages'} received.`;

  return (
    <PageShell>
      <PageHeader
        title="Inbox"
        description="Enquiries submitted through the Contact form on the website."
      />

      <Card icon={FaInbox} title="Messages" description={cardDescription}>
        {inboxEmpty ? (
          <EmptyState
            icon={FaEnvelopeOpenText}
            title="No messages yet"
            message="Enquiries sent through the website's contact form will show up here."
          />
        ) : (
          <>
            <FilterBar
              onReset={() => setFilters(EMPTY_FILTERS)}
              canReset={filtersActive}
            >
              <FilterField label="Search Message" htmlFor="inbox-search">
                <FilterInput
                  id="inbox-search"
                  placeholder="Name / Email / Message"
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                />
              </FilterField>
              <FilterField label="Date" htmlFor="inbox-period">
                <FilterSelect
                  id="inbox-period"
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
              {filters.period === 'custom' &&
                DateRangeFields({
                  idPrefix: 'inbox',
                  from: filters.from,
                  to: filters.to,
                  onChange: setFilter,
                })}
              <FilterField label="Sort By" htmlFor="inbox-sort">
                <FilterSelect
                  id="inbox-sort"
                  value={filters.sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="nameAsc">Name (A–Z)</option>
                  <option value="nameDesc">Name (Z–A)</option>
                </FilterSelect>
              </FilterField>
            </FilterBar>

            {loading ? (
              <MessageListSkeleton />
            ) : total === 0 ? (
              <EmptyState
                icon={FaSearch}
                title="No matching messages"
                message="No message matches these filters. Try a different search or time range."
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
                    {messages.map((msg) => (
                      <Tr key={msg._id}>
                        <Td className="font-medium text-gray-900">{msg.name}</Td>
                        <Td className="break-all">{msg.email}</Td>
                        <Td className="whitespace-nowrap text-gray-500">
                          {formatDate(msg.createdAt)}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <IconButton
                              icon={FaEye}
                              label="View message"
                              onClick={() => setSelectedMessage(msg)}
                            />
                            <IconButton
                              icon={FaReply}
                              label="Reply by email"
                              variant="green"
                              onClick={() => handleReply(msg.email)}
                            />
                            <IconButton
                              icon={FaTrash}
                              label="Delete message"
                              variant="red"
                              onClick={() => setMessageToDelete(msg)}
                            />
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </DataTable>
                </div>

                {/* Card view for mobile */}
                <div className="grid gap-4 md:hidden">
                  {messages.map((msg) => (
                    <MobileCard key={msg._id}>
                      <h3 className="text-base font-semibold text-gray-900">
                        {msg.name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <CardRow label="Email">{msg.email}</CardRow>
                        <CardRow label="Date & Time">{formatDate(msg.createdAt)}</CardRow>
                      </div>
                      {/* Two per row: three side by side is too cramped on a phone. */}
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FaEye}
                          onClick={() => setSelectedMessage(msg)}
                        >
                          View
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          icon={FaReply}
                          onClick={() => handleReply(msg.email)}
                        >
                          Reply
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={FaTrash}
                          className="col-span-2"
                          onClick={() => setMessageToDelete(msg)}
                        >
                          Delete
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

      {/* Selected message */}
      <Modal
        open={Boolean(selectedMessage)}
        icon={FaEnvelopeOpenText}
        title={selectedMessage?.name}
        description={
          selectedMessage ? formatDate(selectedMessage.createdAt) : undefined
        }
        onClose={() => setSelectedMessage(null)}
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Email">
                <span className="break-all">{selectedMessage.email}</span>
              </Detail>
              <Detail label="Mobile">{selectedMessage.number || '—'}</Detail>
            </div>

            <Detail label="Message">
              <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 leading-relaxed text-gray-700">
                {selectedMessage.message}
              </p>
            </Detail>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(messageToDelete)}
        title="Delete this message?"
        message="This message will be permanently removed from your inbox. This action cannot be undone."
        itemName={
          messageToDelete
            ? `${messageToDelete.name} — ${messageToDelete.email}`
            : undefined
        }
        confirmText="Delete Message"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setMessageToDelete(null)}
      />

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

export default Inbox;
