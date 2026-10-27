"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Chip, Empty, ErrorNote, ListSkeleton, PageHeader, SegmentedControl } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

interface RecoveryRequest {
  id: string;
  email: string;
  kind: "normal" | "super";
  status: "pending" | "approved" | "ready" | "completed" | "expired" | "denied";
  requested_at: string;
  ready_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  confirmed: boolean;
  lastSignIn: string | null;
  createdAt: string;
  onboarded_at: string | null;
}

interface Attempt {
  id: number;
  email: string;
  success: boolean;
  ip: string | null;
  question_text: string | null;
  created_at: string;
}

const STATUS_TONE = {
  pending: "warn",
  approved: "planner",
  ready: "good",
  completed: "neutral",
  expired: "neutral",
  denied: "bad",
} as const;

function RecoveryTab() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "recovery"],
    queryFn: () => api<{ requests: RecoveryRequest[] }>("/admin/recovery"),
    refetchInterval: 30_000,
  });
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "deny" }) =>
      api(`/admin/recovery/${id}/${action}`, { method: "POST" }),
    onSuccess: (_result, { action }) => {
      void client.invalidateQueries({ queryKey: ["admin", "recovery"] });
      toast(action === "approve" ? "Approved" : "Denied");
    },
    onError: (mutationError) => toast(mutationError.message, { tone: "error" }),
  });

  if (isLoading) return <ListSkeleton />;
  const requests = data?.requests ?? [];

  return (
    <>
      <ErrorNote error={error} />
      {requests.length === 0 ? (
        <Empty title="No requests" hint="Nobody has forgotten anything lately." />
      ) : (
        <ul className="divide-y divide-line">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate text-sm">{request.email}</p>
                <p className="text-xs text-ink-3">
                  Requested {formatDateTime(request.requested_at)} · usable from {formatDateTime(request.ready_at)}
                </p>
              </div>
              <Chip tone={request.kind === "super" ? "diary" : "neutral"}>{request.kind === "super" ? "Super" : "Normal"}</Chip>
              <Chip tone={STATUS_TONE[request.status]}>{request.status}</Chip>
              {request.status === "pending" && (
                <span className="flex gap-1.5">
                  <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ id: request.id, action: "approve" })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" disabled={act.isPending} onClick={() => act.mutate({ id: request.id, action: "deny" })}>
                    Deny
                  </Button>
                </span>
              )}
              {(request.status === "approved" || request.status === "ready") && (
                <Button size="sm" variant="danger" disabled={act.isPending} onClick={() => act.mutate({ id: request.id, action: "deny" })}>
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function UsersTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api<{ users: AdminUser[] }>("/admin/users"),
  });
  if (isLoading) return <ListSkeleton />;
  return (
    <>
      <ErrorNote error={error} />
      <ul className="divide-y divide-line">
        {(data?.users ?? []).map((user) => (
          <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1 basis-56">
              <p className="truncate text-sm">
                {user.display_name || "No name"} <span className="text-ink-3">· {user.email}</span>
              </p>
              <p className="text-xs text-ink-3">
                Joined {formatDateTime(user.createdAt)}
                {user.lastSignIn && ` · last sign-in ${formatDateTime(user.lastSignIn)}`}
              </p>
            </div>
            {user.role === "admin" && <Chip tone="diary">Admin</Chip>}
            <Chip tone={user.confirmed ? "good" : "warn"}>{user.confirmed ? "Confirmed" : "Unconfirmed"}</Chip>
          </li>
        ))}
      </ul>
    </>
  );
}

function SecurityLogTab() {
  const [outcome, setOutcome] = useState<"failed" | "passed" | "all">("failed");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "log", outcome],
    queryFn: () => api<{ attempts: Attempt[] }>(`/admin/security-log?outcome=${outcome}`),
  });
  const attempts = data?.attempts ?? [];
  return (
    <>
      <div className="mb-3">
        <SegmentedControl
          label="Filter attempts"
          value={outcome}
          onChange={setOutcome}
          options={[
            { value: "failed", label: "Failed" },
            { value: "passed", label: "Passed" },
            { value: "all", label: "All" },
          ]}
        />
      </div>
      <ErrorNote error={error} />
      {isLoading ? (
        <ListSkeleton />
      ) : attempts.length === 0 ? (
        <Empty compact title="Nothing logged" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-ink-3">
              <tr>
                <th scope="col" className="py-2 pr-4 font-normal">Time</th>
                <th scope="col" className="py-2 pr-4 font-normal">Account</th>
                <th scope="col" className="py-2 pr-4 font-normal">Result</th>
                <th scope="col" className="py-2 pr-4 font-normal">Address</th>
                <th scope="col" className="py-2 font-normal">Question</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="border-t border-line">
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(attempt.created_at)}</td>
                  <td className="py-2 pr-4">{attempt.email}</td>
                  <td className="py-2 pr-4">
                    <Chip tone={attempt.success ? "good" : "bad"}>{attempt.success ? "Passed" : "Failed"}</Chip>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">{attempt.ip ?? "–"}</td>
                  <td className="py-2 text-ink-2">{attempt.question_text ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<"recovery" | "users" | "log">("recovery");
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-6 lg:py-8 lg:pb-12">
      <PageHeader title="Admin" />
      <div className="mb-4">
        <SegmentedControl
          label="Admin section"
          value={tab}
          onChange={setTab}
          options={[
            { value: "recovery", label: "Recovery requests" },
            { value: "users", label: "Users" },
            { value: "log", label: "Security log" },
          ]}
        />
      </div>
      <Card>
        {tab === "recovery" && <RecoveryTab />}
        {tab === "users" && <UsersTab />}
        {tab === "log" && <SecurityLogTab />}
      </Card>
    </main>
  );
}
