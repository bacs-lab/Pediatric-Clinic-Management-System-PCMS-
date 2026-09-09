import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import { roles } from "@/features/demo/data";
import {
  grantStaffRoleAction,
  updateProfileAccountStatusAction,
  updateStaffMembershipStatusAction,
} from "@/features/pcms/actions";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";

export const dynamic = "force-dynamic";

type StaffRole = Database["public"]["Enums"]["staff_role"];
type LifecycleStatus = Database["public"]["Enums"]["lifecycle_status"];

type AdminProfileRow = {
  account_status: string;
  created_at: string;
  display_name: string;
  id: string;
};

type AdminMembershipRow = {
  created_at: string;
  id: string;
  profile_id: string;
  role: StaffRole;
  status: LifecycleStatus;
};

type AdminAccountsModel =
  | {
      currentProfileId: string;
      memberships: AdminMembershipRow[];
      profiles: AdminProfileRow[];
      source: "supabase";
    }
  | {
      source: "demo";
    }
  | {
      source: "denied";
    };

async function getAdminAccountsModel(): Promise<AdminAccountsModel> {
  if (!getSupabaseConfig()) {
    return { source: "demo" };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return { source: "denied" };
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("id, clinic_id, account_status")
    .eq("user_id", claimsData.claims.sub)
    .eq("account_status", "active")
    .maybeSingle();

  if (currentProfileError || !currentProfile?.id || !currentProfile.clinic_id) {
    return { source: "denied" };
  }

  const { data: currentAdminMembership, error: currentAdminError } =
    await supabase
      .from("staff_memberships")
      .select("id")
      .eq("profile_id", currentProfile.id)
      .eq("clinic_id", currentProfile.clinic_id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

  if (currentAdminError || !currentAdminMembership) {
    return { source: "denied" };
  }

  const [profilesResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, account_status, created_at")
      .eq("clinic_id", currentProfile.clinic_id)
      .order("display_name"),
    supabase
      .from("staff_memberships")
      .select("id, profile_id, role, status, created_at")
      .eq("clinic_id", currentProfile.clinic_id)
      .order("created_at", { ascending: false }),
  ]);

  if (profilesResult.error || membershipsResult.error) {
    return { source: "denied" };
  }

  return {
    currentProfileId: currentProfile.id,
    memberships: (membershipsResult.data ?? []) as AdminMembershipRow[],
    profiles: (profilesResult.data ?? []) as AdminProfileRow[],
    source: "supabase",
  };
}

function roleLabel(role: StaffRole) {
  return roles.find((item) => item.role === role)?.label ?? role;
}

function StatusSelect({
  currentStatus,
  includeInactive = true,
  name,
}: Readonly<{
  currentStatus: string;
  includeInactive?: boolean;
  name: string;
}>) {
  return (
    <select
      name={name}
      defaultValue={currentStatus === "active" ? "active" : "inactive"}
      className="rounded-md border border-clinic-line px-2 py-1 text-sm"
    >
      <option value="active">Active</option>
      {includeInactive ? <option value="inactive">Inactive</option> : null}
    </select>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const model = await getAdminAccountsModel();

  if (model.source === "demo") {
    return (
      <AppShell title="Accounts and Roles">
        <DataTable
          columns={["Role", "Scope"]}
          rows={roles.map((role) => [role.label, role.scope])}
        />
      </AppShell>
    );
  }

  if (model.source === "denied") {
    return (
      <AppShell title="Accounts and Roles">
        <WorkflowFeedback
          value={resolvedSearchParams.workflow ?? "admin-required"}
        />
      </AppShell>
    );
  }

  const membershipsByProfileId = new Map<string, AdminMembershipRow[]>();
  model.memberships.forEach((membership) => {
    membershipsByProfileId.set(membership.profile_id, [
      ...(membershipsByProfileId.get(membership.profile_id) ?? []),
      membership,
    ]);
  });

  return (
    <AppShell title="Accounts and Roles">
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <DataTable
          columns={["Account", "Account Status", "Roles", "Grant Role"]}
          rows={model.profiles.map((profile) => {
            const isCurrentProfile = profile.id === model.currentProfileId;
            const memberships = membershipsByProfileId.get(profile.id) ?? [];

            return [
              <div key={`${profile.id}-account`} className="grid gap-1">
                <span className="font-semibold">{profile.display_name}</span>
                <span className="text-xs text-clinic-muted">
                  Created {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>,
              <form
                key={`${profile.id}-status`}
                action={updateProfileAccountStatusAction}
                className="grid min-w-56 gap-2"
              >
                <input type="hidden" name="profileId" value={profile.id} />
                <div className="flex items-center gap-2">
                  <StatusPill value={profile.account_status} />
                  <StatusSelect
                    currentStatus={profile.account_status}
                    includeInactive={!isCurrentProfile}
                    name="status"
                  />
                </div>
                <input
                  name="reason"
                  placeholder="Status reason"
                  minLength={5}
                  maxLength={300}
                  required
                  className="rounded-md border border-clinic-line px-2 py-1 text-sm"
                />
                <button type="submit" className="secondary-btn">
                  Apply
                </button>
              </form>,
              <div key={`${profile.id}-roles`} className="grid gap-2">
                {memberships.length > 0 ? (
                  memberships.map((membership) => {
                    const isOwnAdminMembership =
                      isCurrentProfile && membership.role === "admin";

                    return (
                      <form
                        key={membership.id}
                        action={updateStaffMembershipStatusAction}
                        className="grid min-w-72 gap-2 border-b border-clinic-line pb-2 last:border-b-0 last:pb-0"
                      >
                        <input
                          type="hidden"
                          name="membershipId"
                          value={membership.id}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {roleLabel(membership.role)}
                          </span>
                          <StatusPill value={membership.status} />
                          <StatusSelect
                            currentStatus={membership.status}
                            includeInactive={!isOwnAdminMembership}
                            name="status"
                          />
                        </div>
                        <input
                          name="reason"
                          placeholder="Membership reason"
                          minLength={5}
                          maxLength={300}
                          required
                          className="rounded-md border border-clinic-line px-2 py-1 text-sm"
                        />
                        <button type="submit" className="secondary-btn">
                          Update role status
                        </button>
                      </form>
                    );
                  })
                ) : (
                  <span className="text-sm text-clinic-muted">
                    No staff roles
                  </span>
                )}
              </div>,
              <form
                key={`${profile.id}-grant`}
                action={grantStaffRoleAction}
                className="grid min-w-56 gap-2"
              >
                <input type="hidden" name="profileId" value={profile.id} />
                <select
                  name="role"
                  defaultValue="staff"
                  className="rounded-md border border-clinic-line px-2 py-1 text-sm"
                >
                  {roles
                    .filter((role) => role.role !== "guardian")
                    .map((role) => (
                      <option key={role.role} value={role.role}>
                        {role.label}
                      </option>
                    ))}
                </select>
                <input
                  name="reason"
                  placeholder="Grant reason"
                  minLength={5}
                  maxLength={300}
                  required
                  className="rounded-md border border-clinic-line px-2 py-1 text-sm"
                />
                <button type="submit" className="primary-btn">
                  Grant
                </button>
              </form>,
            ];
          })}
        />
      </div>
    </AppShell>
  );
}
