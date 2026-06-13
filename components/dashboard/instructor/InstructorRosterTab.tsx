'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Copy, Check, Trash2, UserPlus, Clock, Mail, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

interface FoundUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

type CourseRole = 'OWNER' | 'CO_INSTRUCTOR' | 'TEACHING_ASSISTANT';

interface RosterMember {
  id: string;
  role: CourseRole;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface PendingInvite {
  id: string;
  token: string;
  email: string;
  role: CourseRole;
  expiresAt: string;
  createdAt: string;
}

interface RosterData {
  myRole: CourseRole;
  instructors: RosterMember[];
  pendingInvites: PendingInvite[];
}

const ROLE_LABELS: Record<CourseRole, string> = {
  OWNER: 'Owner',
  CO_INSTRUCTOR: 'Co-Instructor',
  TEACHING_ASSISTANT: 'Teaching Assistant',
};

const ROLE_BADGE: Record<CourseRole, string> = {
  OWNER: 'bg-primary/10 text-primary',
  CO_INSTRUCTOR: 'bg-amber-100 text-amber-700',
  TEACHING_ASSISTANT: 'bg-green-100 text-green-700',
};

const ROLE_OPTIONS = [
  { value: 'CO_INSTRUCTOR', label: 'Co-Instructor' },
  { value: 'TEACHING_ASSISTANT', label: 'Teaching Assistant' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-lg hover:bg-background text-text-mute hover:text-primary transition-colors"
      title="Copy link"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

interface Props {
  courseId: string;
  isAdmin?: boolean;
  initialData?: RosterData;
}

export default function InstructorRosterTab({ courseId, isAdmin = false, initialData }: Props) {
  const [data, setData] = useState<RosterData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<FoundUser | null | undefined>(undefined);
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; name: string } | null>(null);

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/instructors`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to load course team');
        return;
      }
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!initialData) fetchRoster();
  }, [fetchRoster, initialData]);

  const handleEmailChange = (value: string) => {
    setInviteEmail(value);
    setFoundUser(undefined);
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    const trimmed = value.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    lookupTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/users/lookup?email=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      setFoundUser(json.user ?? null);
    }, 400);
  };

  const clearInviteForm = () => {
    setInviteEmail('');
    setFoundUser(undefined);
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setLastInviteUrl(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to send invite');
        return;
      }
      const roleLabel = ROLE_LABELS[json.invite?.role as CourseRole] ?? 'course team member';
      toast.success(`Invite created for ${roleLabel}.`);
      setLastInviteUrl(json.inviteUrl);
      clearInviteForm();
      fetchRoster();
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (targetUserId: string, role: 'CO_INSTRUCTOR' | 'TEACHING_ASSISTANT') => {
    setChangingRoleId(targetUserId);
    try {
      const res = await fetch(`/api/courses/${courseId}/instructors/${targetUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to update role');
        return;
      }
      toast.success('Role updated');
      fetchRoster();
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleRemoveConfirmed = async () => {
    if (!confirmRemove) return;
    const { userId: targetUserId, name } = confirmRemove;
    setRemovingId(targetUserId);
    setConfirmRemove(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/instructors/${targetUserId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to remove team member');
        return;
      }
      toast.success(`${name} removed from the course.`);
      fetchRoster();
    } finally {
      setRemovingId(null);
    }
  };

  const isOwner = !isAdmin && data?.myRole === 'OWNER';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
        <div className="h-5 w-32 rounded-lg bg-background" />
        <div className="bg-white border border-stroke rounded-2xl divide-y divide-stroke overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-background shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 rounded bg-background" />
                <div className="h-2.5 w-28 rounded bg-background" />
              </div>
              <div className="h-6 w-20 rounded-full bg-background" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <ConfirmModal
        open={!!confirmRemove}
        title="Remove team member"
        message={`Remove ${confirmRemove?.name ?? 'this team member'} from the course? They will lose access immediately.`}
        confirmLabel="Remove"
        destructive
        loading={!!removingId}
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setConfirmRemove(null)}
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 className="text-base font-semibold text-navy mb-4">Course Team</h2>
          <div className="bg-white border border-stroke rounded-2xl divide-y divide-stroke overflow-hidden">
            {data.instructors.map((member) => (
              <div key={member.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-background">
                    {member.user.image ? (
                      <Image src={member.user.image} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-primary bg-primary/10">
                        {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{member.user.name ?? 'No name yet'}</p>
                    <p className="text-xs text-text-mute truncate">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${ROLE_BADGE[member.role]}`}>
                    {ROLE_LABELS[member.role]}
                  </span>

                  {isOwner && member.role !== 'OWNER' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <CustomSelect
                        options={ROLE_OPTIONS}
                        value={member.role}
                        disabled={changingRoleId === member.user.id}
                        onChange={(value) => handleChangeRole(member.user.id, value as 'CO_INSTRUCTOR' | 'TEACHING_ASSISTANT')}
                        className="w-[190px]"
                      />
                      <button
                        onClick={() => setConfirmRemove({ userId: member.user.id, name: member.user.name ?? member.user.email })}
                        disabled={removingId === member.user.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-text-mute hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {data.instructors.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-text-mute">
                No course team members added yet.
              </div>
            )}
          </div>
        </section>

        {data.pendingInvites.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-navy mb-4">Pending Invites</h2>
            <div className="bg-white border border-stroke rounded-2xl divide-y divide-stroke overflow-hidden">
              {data.pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-text-mute" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{invite.email}</p>
                    <p className="text-xs text-text-mute flex items-center gap-1">
                      <Clock size={11} />
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${ROLE_BADGE[invite.role]}`}>
                    {ROLE_LABELS[invite.role]}
                  </span>

                  <CopyButton text={`${appUrl}/invite/course/${invite.token}`} />
                </div>
              ))}
            </div>
          </section>
        )}

        {isOwner && (
          <section>
            <h2 className="text-base font-semibold text-navy mb-4">Invite to Course Team</h2>
            <div className="bg-white border border-stroke rounded-2xl p-5 space-y-4">
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  {foundUser !== undefined && inviteEmail ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-primary/40 rounded-xl bg-primary/5">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 bg-background">
                        {foundUser?.image ? (
                          <Image src={foundUser.image} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-primary bg-primary/10">
                            {foundUser ? (foundUser.name ?? foundUser.email).charAt(0).toUpperCase() : <Mail size={12} />}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {foundUser ? (
                          <>
                            <p className="text-xs font-semibold text-navy truncate">{foundUser.name ?? foundUser.email}</p>
                            <p className="text-[10px] text-text-mute truncate">{foundUser.email}</p>
                          </>
                        ) : (
                          <p className="text-xs text-text-mute truncate">
                            {inviteEmail} <span className="text-amber-600">(not on platform)</span>
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={clearInviteForm} className="p-1 text-text-mute hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="email"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      required
                      className="w-full text-sm px-4 py-2.5 border border-stroke rounded-xl focus:outline-none focus:border-primary transition-colors bg-background placeholder:text-text-mute"
                    />
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  rounded="[10px]"
                  hasBorder={false}
                  loading={inviting}
                  leftIcon={<UserPlus size={14} />}
                >
                  Invite
                </Button>
              </form>

              {lastInviteUrl && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="flex-1 text-xs text-primary font-medium truncate">{lastInviteUrl}</p>
                  <CopyButton text={lastInviteUrl} />
                </div>
              )}

              <p className="text-xs text-text-mute">
                Existing instructors join as co-instructors. Students join as teaching assistants and are not upgraded to instructors.
              </p>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
