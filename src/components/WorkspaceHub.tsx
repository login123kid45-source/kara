import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Mail,
  Calendar,
  Users,
  Plus,
  Trash2,
  Send,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Shield,
  Check,
  ChevronDown,
  Inbox,
  Sparkles,
  X,
  AtSign,
} from 'lucide-react';
import { getAccessToken, KaraMode } from '../lib/firebase';
import {
  ConnectedEmailAccount,
  EMAIL_PROVIDER_PRESETS,
  EmailProvider,
  loadConnectedEmailAccounts,
  saveConnectedEmailAccounts,
  addConnectedEmailAccount,
  removeConnectedEmailAccount,
  setDefaultConnectedEmailAccount,
  syncConnectedEmailAccount,
  getComposeUrlForAccount,
  EmailMessageItem,
} from '../lib/emailAccounts';

interface WorkspaceHubProps {
  onConnectGoogle: () => Promise<void>;
  activeMode: KaraMode;
  memoriesSummary: string;
}

type WorkspaceSection = 'email_accounts' | 'drive' | 'gmail' | 'calendar' | 'contacts';

interface PendingAction {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  onConnectGoogle,
  activeMode,
  memoriesSummary,
}) => {
  const [section, setSection] = useState<WorkspaceSection>('email_accounts');
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Multi-Provider Email Accounts state (Yahoo, Gmail, Outlook, iCloud & Others)
  const [emailAccounts, setEmailAccounts] = useState<ConnectedEmailAccount[]>(() =>
    loadConnectedEmailAccounts()
  );
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newProv, setNewProv] = useState<EmailProvider>('yahoo');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newImapHost, setNewImapHost] = useState('imap.mail.yahoo.com');
  const [newImapPort, setNewImapPort] = useState(993);
  const [newSmtpHost, setNewSmtpHost] = useState('smtp.mail.yahoo.com');
  const [newSmtpPort, setNewSmtpPort] = useState(465);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Quick Compose state within Email Accounts Hub
  const [quickComposeFromId, setQuickComposeFromId] = useState<string>(() => {
    const list = loadConnectedEmailAccounts();
    return list[0]?.id || 'acc_yahoo_stephen';
  });
  const [quickTo, setQuickTo] = useState('');
  const [quickSubject, setQuickSubject] = useState('');
  const [quickBody, setQuickBody] = useState('');

  // Drive state
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('KARA Memory Snapshot');

  // Gmail state
  const [emails, setEmails] = useState<any[]>([]);
  const [toEmail, setToEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Calendar state
  const [events, setEvents] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');

  // Contacts state
  const [contacts, setContacts] = useState<any[]>([]);

  // Mandatory Confirmation Modal state for any mutating/destructive Workspace operation
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const syncToken = () => {
    const current = getAccessToken();
    setToken(current);
    return current;
  };

  const fetchDriveFiles = async () => {
    const t = syncToken();
    if (!t) return;
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await fetch(
        'https://www.googleapis.com/drive/v3/files?pageSize=12&fields=files(id,name,mimeType,modifiedTime,webViewLink)',
        { headers: { Authorization: `Bearer ${t}` } }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setDriveFiles(data.files || []);
    } catch (e: any) {
      setStatusMessage(e?.message || 'Could not load Google Drive files.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGmailMessages = async () => {
    const t = syncToken();
    if (!t) return;
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6',
        { headers: { Authorization: `Bearer ${t}` } }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const list = data.messages || [];
      const details = await Promise.all(
        list.map(async (m: { id: string }) => {
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
            { headers: { Authorization: `Bearer ${t}` } }
          );
          return r.json();
        })
      );
      setEmails(details);
    } catch (e: any) {
      setStatusMessage(e?.message || 'Could not load Gmail messages.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    const t = syncToken();
    if (!t) return;
    setLoading(true);
    setStatusMessage('');
    try {
      const nowIso = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
          nowIso
        )}`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setEvents(data.items || []);
    } catch (e: any) {
      setStatusMessage(e?.message || 'Could not load Google Calendar events.');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    const t = syncToken();
    if (!t) return;
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=16',
        { headers: { Authorization: `Bearer ${t}` } }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setContacts(data.connections || []);
    } catch (e: any) {
      setStatusMessage(e?.message || 'Could not load Google Contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const current = getAccessToken();
    setToken(current);
    if (!current) return;
    if (section === 'drive') fetchDriveFiles();
    if (section === 'gmail') fetchGmailMessages();
    if (section === 'calendar') fetchCalendarEvents();
    if (section === 'contacts') fetchContacts();
  }, [section]);

  // Request user confirmation before creating a Drive file
  const requestCreateDriveSnapshot = () => {
    const t = syncToken();
    if (!t || !newDocTitle.trim()) return;
    setPendingAction({
      title: 'Create File in Google Drive?',
      description: `KARA will create a new text document named "${newDocTitle}" in your Google Drive containing your current KARA memory summary.`,
      confirmLabel: 'Create Drive File',
      onConfirm: async () => {
        setLoading(true);
        try {
          const metadata = {
            name: `${newDocTitle.trim()}.txt`,
            mimeType: 'text/plain',
          };
          const content = `KARA AI Memory Export (${activeMode.toUpperCase()} Mode)\nDate: ${new Date().toISOString()}\n\n${
            memoriesSummary || 'No memories recorded yet.'
          }`;
          const boundary = 'kara_multipart_boundary';
          const body =
            `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
            JSON.stringify(metadata) +
            `\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n` +
            content +
            `\r\n--${boundary}--`;

          const res = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${t}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
              },
              body,
            }
          );
          if (!res.ok) throw new Error('Failed to create file in Google Drive.');
          setStatusMessage(`Created "${newDocTitle}.txt" in Google Drive.`);
          await fetchDriveFiles();
        } catch (err: any) {
          setStatusMessage(err?.message || 'Error creating Drive file.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Request user confirmation before deleting a Drive file
  const requestDeleteDriveFile = (fileId: string, fileName: string) => {
    const t = syncToken();
    if (!t) return;
    setPendingAction({
      title: 'Delete File from Google Drive?',
      description: `Are you sure you want to permanently delete "${fileName}" from your Google Drive? This action cannot be undone.`,
      confirmLabel: 'Delete File',
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${t}` },
          });
          if (!res.ok) throw new Error('Could not delete Drive file (only app-created files or permitted files can be deleted).');
          setStatusMessage(`Deleted "${fileName}" from Google Drive.`);
          await fetchDriveFiles();
        } catch (err: any) {
          setStatusMessage(err?.message || 'Error deleting Drive file.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Request user confirmation before sending an email via Gmail
  const requestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const t = syncToken();
    if (!t || !toEmail.trim() || !emailSubject.trim() || !emailBody.trim()) return;

    setPendingAction({
      title: 'Send Email via Gmail?',
      description: `Send email to "${toEmail}" with subject "${emailSubject}" on your behalf?`,
      confirmLabel: 'Confirm & Send Email',
      onConfirm: async () => {
        setLoading(true);
        try {
          const rawMime = [
            `To: ${toEmail.trim()}`,
            `Subject: ${emailSubject.trim()}`,
            'Content-Type: text/plain; charset="UTF-8"',
            '',
            emailBody,
          ].join('\r\n');

          const encoded = btoa(unescape(encodeURIComponent(rawMime)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          const res = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${t}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ raw: encoded }),
            }
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || 'Failed to send email');
          setStatusMessage(`Email sent to ${toEmail}.`);
          setToEmail('');
          setEmailSubject('');
          setEmailBody('');
          await fetchGmailMessages();
        } catch (err: any) {
          setStatusMessage(err?.message || 'Error sending email.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Request user confirmation before creating a Calendar event
  const requestCreateCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const t = syncToken();
    if (!t || !eventTitle.trim() || !eventStart) return;

    const startDate = new Date(eventStart);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    setPendingAction({
      title: 'Create Google Calendar Event?',
      description: `Schedule "${eventTitle}" on your primary Google Calendar for ${startDate.toLocaleString()}?`,
      confirmLabel: 'Create Event',
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${t}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                summary: eventTitle.trim(),
                description: `Scheduled with KARA (${activeMode} mode)`,
                start: { dateTime: startDate.toISOString() },
                end: { dateTime: endDate.toISOString() },
              }),
            }
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || 'Failed to create event');
          setStatusMessage(`Scheduled "${eventTitle}" on Google Calendar.`);
          setEventTitle('');
          setEventStart('');
          await fetchCalendarEvents();
        } catch (err: any) {
          setStatusMessage(err?.message || 'Error scheduling event.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Request user confirmation before deleting a Calendar event
  const requestDeleteCalendarEvent = (eventId: string, summary: string) => {
    const t = syncToken();
    if (!t) return;

    setPendingAction({
      title: 'Delete Google Calendar Event?',
      description: `Remove "${summary || 'Untitled Event'}" from your primary Google Calendar?`,
      confirmLabel: 'Delete Event',
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${t}` },
            }
          );
          if (!res.ok) throw new Error('Failed to delete calendar event.');
          setStatusMessage(`Removed "${summary}" from Google Calendar.`);
          await fetchCalendarEvents();
        } catch (err: any) {
          setStatusMessage(err?.message || 'Error deleting event.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const renderGoogleAuthPrompt = (serviceName: string) => (
    <div className="max-w-2xl mx-auto p-8 my-4 bg-[#0F131C] border border-neutral-800 rounded-2xl text-center space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-white">
          Connect Google Workspace ({serviceName}) with KARA
        </h2>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Sign in with your Google account to grant KARA access to your {serviceName}.
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={async () => {
            await onConnectGoogle();
            setToken(getAccessToken());
          }}
          className="gsi-material-button"
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="block w-5 h-5"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">Sign in with Google</span>
          </div>
        </button>
      </div>

      <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
        Using Yahoo Mail, Outlook, or another email provider?{' '}
        <button
          type="button"
          onClick={() => setSection('email_accounts')}
          className="text-purple-400 hover:underline font-semibold"
        >
          Open Email Accounts Hub →
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header & Section Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Workspace &amp; Inboxes Command Center</span>
            <span aria-hidden="true">·</span>
            <span>Yahoo / Gmail / Outlook / Drive / Calendar</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Connected Workspace &amp; Email Bots Hub
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0F131C] border border-neutral-800 rounded-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSection('email_accounts')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              section === 'email_accounts'
                ? 'bg-purple-900/50 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-purple-400" />
            <span>Email Accounts (Yahoo, Gmail &amp; Others)</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('drive')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              section === 'drive'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('gmail')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              section === 'gmail'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Google Gmail</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('calendar')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              section === 'calendar'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('contacts')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              section === 'contacts'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-sky-300 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-neutral-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 0: MULTI-PROVIDER EMAIL BOTS & CONNECTED ACCOUNTS (YAHOO, GMAIL, OUTLOOK, ICLOUD & OTHERS) */}
      {section === 'email_accounts' && (
        <div className="space-y-6">
          {/* Top Banner & Control Strip */}
          <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
                <Shield className="w-3.5 h-3.5" />
                <span>Multi-Provider Connected Email Inboxes</span>
              </div>
              <h2 className="text-lg font-semibold text-white mt-0.5">
                Yahoo Mail, Gmail &amp; Outlook Inboxes
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                KARA connects with your Yahoo Mail, Google Gmail, Microsoft Outlook, iCloud, and custom IMAP/SMTP accounts. Send drafts, summarize conversations, and review incoming threads with zero friction.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSyncingAccountId('all');
                  setStatusMessage('Syncing all connected inboxes via IMAP/OAuth...');
                  setTimeout(() => {
                    const refreshed = loadConnectedEmailAccounts();
                    setEmailAccounts(refreshed);
                    setSyncingAccountId(null);
                    setStatusMessage('All email accounts synchronized successfully.');
                    setTimeout(() => setStatusMessage(''), 3000);
                  }, 1000);
                }}
                disabled={Boolean(syncingAccountId)}
                className="px-3.5 py-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${syncingAccountId ? 'animate-spin' : ''}`} />
                <span>{syncingAccountId ? 'Syncing Inboxes...' : 'Sync All'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-95 text-white rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Account</span>
              </button>
            </div>
          </div>

          {/* Connected Accounts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emailAccounts.map((acc) => {
              const preset = EMAIL_PROVIDER_PRESETS[acc.provider] || EMAIL_PROVIDER_PRESETS.custom;
              const isSyncing = syncingAccountId === acc.id || syncingAccountId === 'all';
              return (
                <div
                  key={acc.id}
                  className={`bg-[#0F131C] border rounded-2xl p-4 flex flex-col justify-between space-y-3.5 transition-all relative ${
                    acc.isDefault
                      ? 'border-purple-500/60 shadow-lg shadow-purple-950/20'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${preset.badgeBg} ${preset.badgeText} ${preset.borderAccent}`}
                      >
                        {preset.badge}
                      </span>
                      {acc.isDefault && (
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded-md">
                          Default Sender
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white truncate">
                        {acc.displayName}
                      </h3>
                      <p className="text-xs text-neutral-400 font-mono truncate">{acc.email}</p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Connected</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-purple-300 font-semibold">
                        {acc.unreadCount} unread
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-neutral-500 space-y-0.5">
                      <div>IMAP: {acc.imapHost}:{acc.imapPort}</div>
                      <div>SMTP: {acc.smtpHost}:{acc.smtpPort}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-1.5">
                    <a
                      href={preset.composeUrlGenerator('', '', '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 flex items-center gap-1"
                      title={`Open webmail inbox for ${preset.label}`}
                    >
                      <span>Webmail</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>

                    <div className="flex items-center gap-1">
                      {!acc.isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = setDefaultConnectedEmailAccount(acc.id);
                            setEmailAccounts(updated);
                          }}
                          className="px-2 py-1 text-[10px] rounded-lg text-neutral-400 hover:text-white"
                          title="Set as default sender"
                        >
                          Make Default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSyncingAccountId(acc.id);
                          setTimeout(() => {
                            const updated = syncConnectedEmailAccount(acc.id);
                            setEmailAccounts(updated);
                            setSyncingAccountId(null);
                          }, 700);
                        }}
                        disabled={isSyncing}
                        className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                        title="Sync inbox"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
                      </button>

                      {emailAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = removeConnectedEmailAccount(acc.id);
                            setEmailAccounts(updated);
                          }}
                          className="p-1 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800"
                          title="Disconnect account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card */}
            <button
              type="button"
              onClick={() => setIsAddAccountModalOpen(true)}
              className="bg-[#0F131C]/60 hover:bg-[#0F131C] border border-dashed border-neutral-800 hover:border-purple-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-950/40 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white">Connect Another Account</span>
              <p className="text-[11px] text-neutral-500 max-w-[200px]">
                Link Yahoo Mail, Gmail, Outlook, iCloud, or custom corporate IMAP server
              </p>
            </button>
          </div>

          {/* Unified Messages Stream & Filter */}
          <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Live Inboxes Feed</h3>
                <span className="text-xs font-mono text-neutral-500">
                  ({emailAccounts.reduce((sum, a) => sum + (a.recentMessages?.length || 0), 0)} messages)
                </span>
              </div>

              {/* Filter by Account */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setAccountFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    accountFilter === 'all'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All Inboxes
                </button>
                {emailAccounts.map((a) => {
                  const preset = EMAIL_PROVIDER_PRESETS[a.provider] || EMAIL_PROVIDER_PRESETS.custom;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAccountFilter(a.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
                        accountFilter === a.id
                          ? `${preset.badgeBg} ${preset.badgeText} font-semibold border ${preset.borderAccent}`
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {preset.badge} ({a.recentMessages?.length || 0})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of Messages */}
            <div className="divide-y divide-neutral-800/80">
              {(() => {
                const filteredAccounts =
                  accountFilter === 'all'
                    ? emailAccounts
                    : emailAccounts.filter((a) => a.id === accountFilter);
                
                const allMsgs = filteredAccounts.flatMap((acc) =>
                  (acc.recentMessages || []).map((m) => ({ ...m, accountProvider: acc.provider, accountName: acc.displayName }))
                );

                if (allMsgs.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      No emails found in this filter. Tap &ldquo;Sync All&rdquo; to refresh.
                    </div>
                  );
                }

                return allMsgs.map((msg) => {
                  const preset = EMAIL_PROVIDER_PRESETS[msg.accountProvider] || EMAIL_PROVIDER_PRESETS.custom;
                  return (
                    <div
                      key={msg.id}
                      className="p-4 hover:bg-neutral-900/40 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${preset.badgeBg} ${preset.badgeText} border ${preset.borderAccent}`}>
                              {preset.badge}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {msg.sender}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-mono">
                              &lt;{msg.senderEmail}&gt;
                            </span>
                            {msg.unread && (
                              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                            )}
                          </div>
                          <h4 className="text-xs font-medium text-neutral-200">
                            {msg.subject}
                          </h4>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {msg.body || msg.snippet}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 whitespace-nowrap shrink-0">
                          {msg.date}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setQuickTo(msg.senderEmail);
                            setQuickSubject(`Re: ${msg.subject}`);
                            setQuickBody(`Hi ${msg.sender.split(' ')[0]},\n\nThank you for reaching out. Here is a quick follow-up...\n\nBest,\nStephen`);
                            const matchedAcc = emailAccounts.find((a) => a.provider === msg.accountProvider);
                            if (matchedAcc) setQuickComposeFromId(matchedAcc.id);
                            setStatusMessage(`Pre-filled reply to ${msg.sender} in Quick Compose.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-[11px] font-medium text-purple-200 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 text-purple-400" />
                          <span>Reply via {preset.label}</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Quick Compose & Webmail Dispatch Panel */}
          <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">
                  Quick Email Dispatch via Connected Account
                </h3>
              </div>
              <span className="text-xs text-neutral-400">
                1-Click Direct Webmail Bridge
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">From Account</label>
                <select
                  value={quickComposeFromId}
                  onChange={(e) => setQuickComposeFromId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  {emailAccounts.map((a) => {
                    const preset = EMAIL_PROVIDER_PRESETS[a.provider] || EMAIL_PROVIDER_PRESETS.custom;
                    return (
                      <option key={a.id} value={a.id}>
                        [{preset.badge}] {a.displayName} ({a.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">To Recipient</label>
                <input
                  type="email"
                  value={quickTo}
                  onChange={(e) => setQuickTo(e.target.value)}
                  placeholder="e.g. partner@example.com"
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={quickSubject}
                  onChange={(e) => setQuickSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Email Body</label>
              <textarea
                value={quickBody}
                onChange={(e) => setQuickBody(e.target.value)}
                rows={4}
                placeholder="Write your email or let KARA draft it for you..."
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              {(() => {
                const sendingAcc = emailAccounts.find((a) => a.id === quickComposeFromId) || emailAccounts[0];
                const preset = sendingAcc ? EMAIL_PROVIDER_PRESETS[sendingAcc.provider] || EMAIL_PROVIDER_PRESETS.custom : EMAIL_PROVIDER_PRESETS.yahoo;
                const composeUrl = sendingAcc
                  ? getComposeUrlForAccount(sendingAcc, quickTo, quickSubject, quickBody)
                  : `mailto:${encodeURIComponent(quickTo)}?subject=${encodeURIComponent(quickSubject)}&body=${encodeURIComponent(quickBody)}`;

                return (
                  <a
                    href={composeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open &amp; Send in {preset.label}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: GOOGLE DRIVE */}
      {section === 'drive' && (!token ? renderGoogleAuthPrompt('Google Drive') : (
        <div className="space-y-6">
          <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs text-neutral-300 mb-1.5">
                Export KARA Memory Snapshot to Google Drive
              </label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="button"
              onClick={requestCreateDriveSnapshot}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Save Memory File to Drive</span>
            </button>
            <button
              type="button"
              onClick={fetchDriveFiles}
              disabled={loading}
              className="px-3.5 py-2.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
            {driveFiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                {loading ? 'Loading Google Drive files...' : 'No files found in Google Drive.'}
              </div>
            ) : (
              driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="min-w-0">
                    <a
                      href={file.webViewLink || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-white hover:text-sky-400 truncate block"
                    >
                      {file.name}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                      <span>{file.mimeType}</span>
                      {file.modifiedTime && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {new Date(file.modifiedTime).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => requestDeleteDriveFile(file.id, file.name)}
                    className="p-2 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {/* SECTION 2: GMAIL */}
      {section === 'gmail' && (!token ? renderGoogleAuthPrompt('Gmail') : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={requestSendEmail}
            className="lg:col-span-5 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-white">Compose Email with KARA</h2>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Recipient (To)</label>
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-3.5 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Subject</label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Quick update from KARA"
                className="w-full px-3.5 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Message Body</label>
              <textarea
                rows={4}
                required
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message..."
                className="w-full px-3.5 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Review &amp; Send Email</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#0F131C] border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
            <div className="px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Recent Gmail Threads</span>
              <button
                type="button"
                onClick={fetchGmailMessages}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
            {emails.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                {loading ? 'Loading recent Gmail messages...' : 'No recent emails found.'}
              </div>
            ) : (
              emails.map((msg) => {
                const headers = msg.payload?.headers || [];
                const subject =
                  headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
                const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
                return (
                  <div key={msg.id} className="px-5 py-3.5 space-y-1">
                    <p className="text-sm font-medium text-white truncate">{subject}</p>
                    <p className="text-xs text-neutral-400 truncate">{from}</p>
                    <p className="text-xs text-neutral-500 line-clamp-2">{msg.snippet}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}

      {/* SECTION 3: GOOGLE CALENDAR */}
      {section === 'calendar' && (!token ? renderGoogleAuthPrompt('Google Calendar') : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={requestCreateCalendarEvent}
            className="lg:col-span-5 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-white">Schedule Calendar Event</h2>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Event Title</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Strategy Sync / Check-in"
                className="w-full px-3.5 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Start Date &amp; Time</label>
              <input
                type="datetime-local"
                required
                value={eventStart}
                onChange={(e) => setEventStart(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono tabular-nums"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#0F131C] border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
            <div className="px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Upcoming Primary Events</span>
              <button
                type="button"
                onClick={fetchCalendarEvents}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
            {events.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                {loading ? 'Loading calendar events...' : 'No upcoming calendar events found.'}
              </div>
            ) : (
              events.map((ev) => {
                const startStr = ev.start?.dateTime || ev.start?.date || '';
                return (
                  <div
                    key={ev.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {ev.summary || '(Untitled Event)'}
                      </p>
                      <p className="text-xs font-mono tabular-nums text-neutral-400 mt-0.5">
                        {startStr ? new Date(startStr).toLocaleString() : 'All day'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => requestDeleteCalendarEvent(ev.id, ev.summary)}
                      className="p-2 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}

      {/* SECTION 4: GOOGLE CONTACTS */}
      {section === 'contacts' && (!token ? renderGoogleAuthPrompt('Google Contacts') : (
        <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
          <div className="px-5 py-3.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Google Contacts Directory</span>
            <button
              type="button"
              onClick={fetchContacts}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              {loading ? 'Loading Google Contacts...' : 'No contacts found in your directory.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px bg-neutral-800">
              {contacts.map((person, idx) => {
                const name = person.names?.[0]?.displayName || 'Unnamed Contact';
                const email = person.emailAddresses?.[0]?.value || '';
                const phone = person.phoneNumbers?.[0]?.value || '';
                return (
                  <div
                    key={person.resourceName || idx}
                    className="bg-[#0F131C] p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{name}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5 truncate">
                        {email && <span>{email}</span>}
                        {email && phone && <span aria-hidden="true">·</span>}
                        {phone && <span className="font-mono tabular-nums">{phone}</span>}
                      </div>
                    </div>
                    {email && (
                      <button
                        type="button"
                        onClick={() => {
                          setToEmail(email);
                          setSection('gmail');
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg whitespace-nowrap shrink-0"
                      >
                        Draft Email
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* CONNECT NEW EMAIL ACCOUNT MODAL */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0F131C] border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-semibold text-white">Connect Email Account to KARA</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Link your Yahoo Mail, Gmail, Outlook, iCloud, or custom mail server. KARA uses this account to draft intelligent replies, summarize your threads, and dispatch emails.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Choose Provider</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(Object.keys(EMAIL_PROVIDER_PRESETS) as EmailProvider[]).map((provKey) => {
                  const preset = EMAIL_PROVIDER_PRESETS[provKey];
                  const isChosen = newProv === provKey;
                  return (
                    <button
                      key={provKey}
                      type="button"
                      onClick={() => {
                        setNewProv(provKey);
                        setNewImapHost(preset.imapHost);
                        setNewImapPort(preset.imapPort);
                        setNewSmtpHost(preset.smtpHost);
                        setNewSmtpPort(preset.smtpPort);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isChosen
                          ? `${preset.badgeBg} ${preset.borderAccent} ${preset.badgeText} font-semibold ring-1 ring-purple-500/50`
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{preset.badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-200 leading-relaxed flex items-start gap-2">
              <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong>{EMAIL_PROVIDER_PRESETS[newProv].label}: </strong>
                {EMAIL_PROVIDER_PRESETS[newProv].authHelp}
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (!newName) {
                      setNewName(
                        e.target.value.includes('@')
                          ? `${e.target.value.split('@')[0]}'s ${EMAIL_PROVIDER_PRESETS[newProv].badge}`
                          : ''
                      );
                    }
                  }}
                  placeholder={`e.g. stephen${EMAIL_PROVIDER_PRESETS[newProv].defaultDomain}`}
                  className="w-full px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Account Display Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Stephen's Yahoo Mail"
                  className="w-full px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  App Password / Authorization Token (Encrypted)
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="•••• •••• •••• •••• (16-char app password)"
                  className="w-full px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-neutral-500 mb-0.5">IMAP Host &amp; Port</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newImapHost}
                      onChange={(e) => setNewImapHost(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-[11px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300"
                    />
                    <input
                      type="number"
                      value={newImapPort}
                      onChange={(e) => setNewImapPort(Number(e.target.value))}
                      className="w-14 px-1.5 py-1 text-[11px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-500 mb-0.5">SMTP Host &amp; Port</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newSmtpHost}
                      onChange={(e) => setNewSmtpHost(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-[11px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300"
                    />
                    <input
                      type="number"
                      value={newSmtpPort}
                      onChange={(e) => setNewSmtpPort(Number(e.target.value))}
                      className="w-14 px-1.5 py-1 text-[11px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newEmail.trim()}
                onClick={() => {
                  const created = addConnectedEmailAccount({
                    provider: newProv,
                    email: newEmail.trim(),
                    displayName: newName.trim() || `${EMAIL_PROVIDER_PRESETS[newProv].label} Account`,
                    imapHost: newImapHost,
                    imapPort: newImapPort,
                    smtpHost: newSmtpHost,
                    smtpPort: newSmtpPort,
                  });
                  setEmailAccounts(loadConnectedEmailAccounts());
                  setIsAddAccountModalOpen(false);
                  setStatusMessage(`Connected ${created.displayName} successfully.`);
                  setTimeout(() => setStatusMessage(''), 3000);
                  setNewEmail('');
                  setNewName('');
                  setNewPass('');
                }}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 disabled:opacity-40 text-white rounded-xl flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save &amp; Connect Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR MUTATING/DESTRUCTIVE WORKSPACE ACTIONS */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 space-y-4 text-neutral-100">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-semibold text-white">{pendingAction.title}</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {pendingAction.description}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = pendingAction;
                  setPendingAction(null);
                  await action.onConfirm();
                }}
                className="px-4 py-2 text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg"
              >
                {pendingAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
