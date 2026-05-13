'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Copy, Check, Trash2, UserPlus, Clock, Mail, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import SelectInput from '@/components/ui/SelectInput';
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
}

export default function InstructorRosterTab({ courseId }: Props) {
  const [data, setData] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'CO_INSTRUCTOR' | 'TEACHING_ASSISTANT'>('CO_INSTRUCTOR');
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<FoundUser | null | undefined>(undefined); // undefined=not looked up, null=not found
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; name: string } | null>(null);

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/instructors`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to load instructor roster');
        return;
      }
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

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
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Failed to send invite'); return; }
      toast.success('Invite created');
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
      if (!res.ok) { toast.error(json.error ?? 'Failed to update role'); return; }
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
      if (!res.ok) { toast.error(json.error ?? 'Failed to remove instructor'); return; }
      toast.success(`${name} removed from the course.`);
      fetchRoster();
    } finally {
      setRemovingId(null);
    }
  };

  const isOwner = data?.myRole === 'OWNER';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
    <ConfirmModal
      open={!!confirmRemove}
      title="Remove instructor"
      message={`Remove ${confirmRemove?.name ?? 'this instructor'} from the course? They will lose editing access immediately.`}
      confirmLabel="Remove"
      destructive
      loading={!!removingId}
      onConfirm={handleRemoveConfirmed}
      onCancel={() => setConfirmRemove(null)}
    />
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Current team */}
      <section>
        <h2 className="text-base font-semibold text-navy mb-4">Course Team</h2>
        <div className="bg-white border border-stroke rounded-2xl divide-y divide-stroke overflow-hidden">
          {data.instructors.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-5 py-4">
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-background">
                {member.user.image ? (
                  <Image src={member.user.image} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-primary bg-primary/10">
                    {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">{member.user.name ?? '—'}</p>
                <p className="text-xs text-text-mute truncate">{member.user.email}</p>
              </div>

              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${ROLE_BADGE[member.role]}`}>
                {ROLE_LABELS[member.role]}
              </span>

              {isOwner && member.role !== 'OWNER' && (
                <div className="flex items-center gap-1 shrink-0">
                  <SelectInput
                    value={member.role}
                    size="sm"
                    disabled={changingRoleId === member.user.id}
                    onChange={(e) => handleChangeRole(member.user.id, e.target.value as 'CO_INSTRUCTOR' | 'TEACHING_ASSISTANT')}
                  >
                    <option value="CO_INSTRUCTOR">Co-Instructor</option>
                    <option value="TEACHING_ASSISTANT">Teaching Assistant</option>
                  </SelectInput>
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
          ))}

          {data.instructors.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-text-mute">
              No instructors added yet.
            </div>
          )}
        </div>
      </section>

      {/* Pending invites — visible to CO_INSTRUCTOR and OWNER */}
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

      {/* Invite form — OWNER only */}
      {isOwner && (
        <section>
          <h2 className="text-base font-semibold text-navy mb-4">Invite Instructor</h2>
          <div className="bg-white border border-stroke rounded-2xl p-5 space-y-4">
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              {/* Email input or user chip */}
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
                        <p className="text-xs text-text-mute truncate">{inviteEmail} <span className="text-amber-600">(not on platform)</span></p>
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

              <SelectInput
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                className="shrink-0"
              >
                <option value="CO_INSTRUCTOR">Co-Instructor</option>
                <option value="TEACHING_ASSISTANT">Teaching Assistant</option>
              </SelectInput>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                rounded="xl"
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
              The invitee must sign in with the invited email address to accept. Invite links expire after 7 days.
            </p>
          </div>
        </section>
      )}

    </div>
    </>
  );
}
