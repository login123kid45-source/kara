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
} from 'lucide-react';
import { getAccessToken, KaraMode } from '../lib/firebase';

interface WorkspaceHubProps {
  onConnectGoogle: () => Promise<void>;
  activeMode: KaraMode;
  memoriesSummary: string;
}

type WorkspaceSection = 'drive' | 'gmail' | 'calendar' | 'contacts';

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
  const [section, setSection] = useState<WorkspaceSection>('drive');
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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

  if (!token) {
    return (
      <div className="max-w-3xl mx-auto p-8 my-8 bg-[#0F131C] border border-neutral-800 rounded-2xl text-center space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">
            Connect Google Workspace with KARA
          </h2>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto">
            Sign in with Google to grant KARA access to your Google Drive files, Gmail inbox, Google Calendar schedule, and Google Contacts.
          </p>
        </div>

        <div className="flex justify-center">
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header & Section Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Google Workspace Integration</span>
            <span aria-hidden="true">·</span>
            <span>Drive / Gmail / Calendar / Contacts</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Connected Workspace Command Center
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0F131C] border border-neutral-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSection('drive')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              section === 'gmail'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('calendar')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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

      {/* SECTION 1: GOOGLE DRIVE */}
      {section === 'drive' && (
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
      )}

      {/* SECTION 2: GMAIL */}
      {section === 'gmail' && (
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
              <span>Review & Send Email</span>
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
      )}

      {/* SECTION 3: GOOGLE CALENDAR */}
      {section === 'calendar' && (
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
              <label className="block text-xs text-neutral-300 mb-1">Start Date & Time</label>
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
      )}

      {/* SECTION 4: GOOGLE CONTACTS */}
      {section === 'contacts' && (
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
