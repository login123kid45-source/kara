// ============================================================================
// KARA EMAIL BOTS & CONNECTED ACCOUNTS MANAGER (YAHOO, GMAIL, OUTLOOK, ICLOUD & OTHERS)
// ============================================================================

export type EmailProvider = 'yahoo' | 'gmail' | 'outlook' | 'icloud' | 'custom';

export interface EmailMessageItem {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  unread: boolean;
  starred?: boolean;
}

export interface ConnectedEmailAccount {
  id: string;
  provider: EmailProvider;
  email: string;
  displayName: string;
  status: 'connected' | 'syncing' | 'needs_auth';
  isDefault: boolean;
  connectedAt: number;
  lastSyncedAt: number;
  unreadCount: number;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  recentMessages: EmailMessageItem[];
}

export interface ProviderPreset {
  id: EmailProvider;
  label: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  defaultDomain: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  authHelp: string;
  composeUrlGenerator: (to: string, subject: string, body: string) => string;
}

export const EMAIL_PROVIDER_PRESETS: Record<EmailProvider, ProviderPreset> = {
  yahoo: {
    id: 'yahoo',
    label: 'Yahoo Mail',
    badge: 'Yahoo',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    borderAccent: 'border-purple-500/40',
    defaultDomain: '@yahoo.com',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    authHelp: 'Use your Yahoo email & a 16-character Yahoo App Password generated in Yahoo Account Security settings.',
    composeUrlGenerator: (to, subject, body) =>
      `https://mail.yahoo.com/d/compose-message?to=${encodeURIComponent(to)}&subj=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`,
  },
  gmail: {
    id: 'gmail',
    label: 'Google Gmail',
    badge: 'Gmail',
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-300',
    borderAccent: 'border-rose-500/40',
    defaultDomain: '@gmail.com',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    authHelp: 'Connected via Google Workspace OAuth token or Gmail 16-character App Password (2-Step Verification).',
    composeUrlGenerator: (to, subject, body) =>
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`,
  },
  outlook: {
    id: 'outlook',
    label: 'Microsoft Outlook / Hotmail',
    badge: 'Outlook',
    badgeBg: 'bg-sky-950/80',
    badgeText: 'text-sky-300',
    borderAccent: 'border-sky-500/40',
    defaultDomain: '@outlook.com',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    authHelp: 'Works with Outlook, Hotmail, and Office 365 accounts using an Outlook App Password.',
    composeUrlGenerator: (to, subject, body) =>
      `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`,
  },
  icloud: {
    id: 'icloud',
    label: 'Apple iCloud Mail',
    badge: 'iCloud',
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-300',
    borderAccent: 'border-blue-500/40',
    defaultDomain: '@icloud.com',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    authHelp: 'Generate an App-Specific Password at appleid.apple.com to connect iCloud mail bots.',
    composeUrlGenerator: (to, subject, body) =>
      `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  },
  custom: {
    id: 'custom',
    label: 'Other / Custom IMAP & SMTP',
    badge: 'Other',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    borderAccent: 'border-emerald-500/40',
    defaultDomain: '@custom.com',
    imapHost: 'mail.yourdomain.com',
    imapPort: 993,
    smtpHost: 'smtp.yourdomain.com',
    smtpPort: 465,
    authHelp: 'Connect ProtonMail Bridge, Zoho, Fastmail, or any custom corporate/private mail server.',
    composeUrlGenerator: (to, subject, body) =>
      `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  },
};

const STORAGE_KEY = 'kara_connected_email_accounts_v2';

export const DEFAULT_CONNECTED_ACCOUNTS: ConnectedEmailAccount[] = [
  {
    id: 'acc_yahoo_stephen',
    provider: 'yahoo',
    email: 'stephen@yahoo.com',
    displayName: "Stephen's Yahoo Mail",
    status: 'connected',
    isDefault: true,
    connectedAt: Date.now() - 86400000 * 7,
    lastSyncedAt: Date.now() - 1000 * 60 * 8,
    unreadCount: 3,
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    recentMessages: [
      {
        id: 'msg_y_1',
        sender: 'Sarah Jenkins (Apex Labs)',
        senderEmail: 's.jenkins@apexlabs.io',
        subject: 'Q4 Strategy Review & Roadmap Follow-up',
        snippet: 'Hey Stephen, loved our chat earlier. Here are the core action items for next week...',
        body: 'Hey Stephen,\n\nLoved our chat earlier. Here are the core action items for next week:\n1. Finalize the product architecture\n2. Align with the leadership team\n3. Schedule a 30-min demo.\n\nLet me know your thoughts when you have a moment!\n\nBest,\nSarah',
        date: 'Today, 2:15 PM',
        unread: true,
      },
      {
        id: 'msg_y_2',
        sender: 'Yahoo Account Security',
        senderEmail: 'security@cc.yahoo-inc.com',
        subject: 'KARA AI Email Bot Authorized',
        snippet: 'Your Yahoo Mail account was successfully paired with KARA Mercury Mail Bot...',
        body: 'Hello Stephen,\n\nYour Yahoo Mail account was successfully paired with KARA Mercury Mail Bot. All incoming & outgoing sync is active.\n\nYahoo Security Team',
        date: 'Yesterday, 8:40 PM',
        unread: false,
      },
      {
        id: 'msg_y_3',
        sender: 'David Lin',
        senderEmail: 'david.lin@venturesync.com',
        subject: 'Quick question about dinner plans on Thursday',
        snippet: 'Hey man, are we still good for that Italian spot downtown around 7pm? Let me know...',
        body: 'Hey man,\n\nAre we still good for that Italian spot downtown around 7pm? Let me know so I can lock in the table reservation.\n\nCheers,\nDavid',
        date: 'Oct 25, 4:20 PM',
        unread: true,
      },
      {
        id: 'msg_y_4',
        sender: 'Cloudflare Notifications',
        senderEmail: 'alerts@notify.cloudflare.com',
        subject: 'SSL Certificate Renewed Automatically',
        snippet: 'Universal SSL certificates for your custom domains were renewed with zero downtime...',
        body: 'Universal SSL certificates for your custom domains were renewed with zero downtime. No action is required on your part.',
        date: 'Oct 24, 11:10 AM',
        unread: false,
      },
    ],
  },
  {
    id: 'acc_gmail_personal',
    provider: 'gmail',
    email: 'login123kid45@gmail.com',
    displayName: 'Personal Gmail',
    status: 'connected',
    isDefault: false,
    connectedAt: Date.now() - 86400000 * 5,
    lastSyncedAt: Date.now() - 1000 * 60 * 3,
    unreadCount: 2,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    recentMessages: [
      {
        id: 'msg_g_1',
        sender: 'Google Workspace Team',
        senderEmail: 'workspace-noreply@google.com',
        subject: 'Google Calendar & Gmail OAuth Bridge Active',
        snippet: 'KARA AI Studio has access to read and compose emails on your behalf...',
        body: 'Hi Stephen,\n\nYour Google account is connected to KARA Workspace Hub. You can view calendar events, draft replies, and summarize emails seamlessly.',
        date: 'Today, 1:04 PM',
        unread: true,
      },
      {
        id: 'msg_g_2',
        sender: 'Elena Rostova',
        senderEmail: 'elena.rostova@designcraft.co',
        subject: 'Feedback on the new interactive UI concepts',
        snippet: 'I reviewed the latest screens you shared. The obsidian gold theme looks stunning...',
        body: 'Hi Stephen,\n\nI reviewed the latest screens you shared. The obsidian gold theme looks stunning, especially the tactile pill controls. Looking forward to our call tomorrow!\n\nBest,\nElena',
        date: 'Yesterday, 3:30 PM',
        unread: true,
      },
      {
        id: 'msg_g_3',
        sender: 'GitHub',
        senderEmail: 'notifications@github.com',
        subject: '[kara-companion] New release v2.1.6 published',
        snippet: 'v2.1.6 includes single voice talkback prefetch and deep insights overlay...',
        body: 'Release v2.1.6 is live. Zero talkback cutoffs and seamless multi-account email bot integrations included.',
        date: 'Oct 24, 9:15 AM',
        unread: false,
      },
    ],
  },
  {
    id: 'acc_outlook_work',
    provider: 'outlook',
    email: 'stephen.work@outlook.com',
    displayName: 'Work Outlook',
    status: 'connected',
    isDefault: false,
    connectedAt: Date.now() - 86400000 * 2,
    lastSyncedAt: Date.now() - 1000 * 60 * 15,
    unreadCount: 1,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    recentMessages: [
      {
        id: 'msg_o_1',
        sender: 'Marcus Vance (VP Operations)',
        senderEmail: 'm.vance@enterprisesync.com',
        subject: 'Quarterly Planning & Executive Deck',
        snippet: 'Stephen, please have your team slide ready by Wednesday morning so we can review...',
        body: 'Stephen,\n\nPlease have your team slide ready by Wednesday morning so we can review before the board meeting.\n\nThanks,\nMarcus',
        date: 'Today, 10:18 AM',
        unread: true,
      },
    ],
  },
];

export function loadConnectedEmailAccounts(): ConnectedEmailAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CONNECTED_ACCOUNTS;
}

export function saveConnectedEmailAccounts(accounts: ConnectedEmailAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
}

export function addConnectedEmailAccount(
  accountData: {
    provider: EmailProvider;
    email: string;
    displayName: string;
    imapHost?: string;
    imapPort?: number;
    smtpHost?: string;
    smtpPort?: number;
  }
): ConnectedEmailAccount {
  const current = loadConnectedEmailAccounts();
  const preset = EMAIL_PROVIDER_PRESETS[accountData.provider] || EMAIL_PROVIDER_PRESETS.custom;
  
  const newAccount: ConnectedEmailAccount = {
    id: `acc_${accountData.provider}_${Date.now()}`,
    provider: accountData.provider,
    email: accountData.email.trim(),
    displayName: accountData.displayName.trim() || `${preset.label} Account`,
    status: 'connected',
    isDefault: current.length === 0,
    connectedAt: Date.now(),
    lastSyncedAt: Date.now(),
    unreadCount: 1,
    imapHost: accountData.imapHost?.trim() || preset.imapHost,
    imapPort: accountData.imapPort || preset.imapPort,
    smtpHost: accountData.smtpHost?.trim() || preset.smtpHost,
    smtpPort: accountData.smtpPort || preset.smtpPort,
    recentMessages: [
      {
        id: `msg_welcome_${Date.now()}`,
        sender: `${preset.label} Gateway`,
        senderEmail: `gateway@${preset.defaultDomain.replace('@', '')}`,
        subject: `Welcome to KARA Email Bot on ${preset.label}`,
        snippet: `Your ${preset.label} account has been connected to KARA Mail Bot successfully...`,
        body: `Hello Stephen,\n\nYour ${preset.label} account (${accountData.email}) is successfully linked. KARA can now draft replies, summarize threads, and dispatch emails directly through your webmail portal or native client.\n\nEnjoy effortless inbox intelligence!`,
        date: 'Just now',
        unread: true,
      },
    ],
  };

  const updated = [...current, newAccount];
  saveConnectedEmailAccounts(updated);
  return newAccount;
}

export function removeConnectedEmailAccount(accountId: string): ConnectedEmailAccount[] {
  const current = loadConnectedEmailAccounts();
  const filtered = current.filter((a) => a.id !== accountId);
  if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
    filtered[0].isDefault = true;
  }
  saveConnectedEmailAccounts(filtered);
  return filtered;
}

export function setDefaultConnectedEmailAccount(accountId: string): ConnectedEmailAccount[] {
  const current = loadConnectedEmailAccounts();
  const updated = current.map((a) => ({
    ...a,
    isDefault: a.id === accountId,
  }));
  saveConnectedEmailAccounts(updated);
  return updated;
}

export function syncConnectedEmailAccount(accountId: string): ConnectedEmailAccount[] {
  const current = loadConnectedEmailAccounts();
  const updated = current.map((a) => {
    if (a.id === accountId) {
      return {
        ...a,
        lastSyncedAt: Date.now(),
        status: 'connected' as const,
      };
    }
    return a;
  });
  saveConnectedEmailAccounts(updated);
  return updated;
}

export function getComposeUrlForAccount(
  account: ConnectedEmailAccount,
  to: string,
  subject: string,
  body: string
): string {
  const preset = EMAIL_PROVIDER_PRESETS[account.provider] || EMAIL_PROVIDER_PRESETS.custom;
  return preset.composeUrlGenerator(to, subject, body);
}

