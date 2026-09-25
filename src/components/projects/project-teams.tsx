"use client";

import { useMemo, useState, useTransition } from "react";
import { ClipboardCheck, Code2, Plus, X } from "lucide-react";
import { addProjectMemberAction, removeProjectMemberAction } from "@/app/actions/projects";
import { CustomSelect } from "@/components/ui/custom-select";
import { useProcess } from "@/components/ui/app-loader";
import { toast } from "@/components/ui/toast";
import { initials, roleLabel } from "@/lib/format";
import type { ProjectMember, ProjectTeam } from "@/lib/data";

type Person = { id: string; name: string; role: string; logo?: string | null };

function PersonChip({
  person,
  onRemove,
}: {
  person: Person;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] bg-[#F8FAFC] py-1 pr-1 pl-1.5">
      {person.logo ? (
        <img src={person.logo} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFF6FF] text-[9px] font-semibold text-[#2563EB]">
          {initials(person.name)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block max-w-[140px] truncate text-xs font-medium text-[#172033]">{person.name}</span>
        <span className="block text-[10px] text-[#64748B]">{roleLabel(person.role)}</span>
      </span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-[3px] p-0.5 text-[#94A3B8] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
          aria-label={`Remove ${person.name}`}
        >
          <X size={12} />
        </button>
      ) : null}
    </span>
  );
}

function TeamCard({
  projectId,
  team,
  title,
  hint,
  icon: Icon,
  iconClass,
  people,
  members,
  canEdit,
}: {
  projectId: string;
  team: ProjectTeam;
  title: string;
  hint: string;
  icon: typeof Code2;
  iconClass: string;
  people: Person[];
  members: ProjectMember[];
  canEdit: boolean;
}) {
  const [pending, start] = useTransition();
  useProcess(pending);
  const [pick, setPick] = useState("");
  const memberIds = members.map((member) => member.userId);
  const options = useMemo(
    () => [
      { value: "", label: "Add a person" },
      ...people
        .filter((person) => !memberIds.includes(person.id))
        .map((person) => ({ value: person.id, label: `${person.name} · ${roleLabel(person.role)}` })),
    ],
    [memberIds, people],
  );

  function add(userId: string) {
    if (!userId) return;
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("userId", userId);
    data.set("team", team);
    start(async () => {
      const result = await addProjectMemberAction(data);
      if (result.ok) toast(`Added to ${title.toLowerCase()}`);
      else toast(result.error, "error");
      setPick("");
    });
  }

  function remove(userId: string, name: string) {
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("userId", userId);
    data.set("team", team);
    start(async () => {
      const result = await removeProjectMemberAction(data);
      if (result.ok) toast(`${name} removed`);
      else toast(result.error, "error");
    });
  }

  return (
    <section className="rounded-[3px] border border-[#E2E8F0] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[3px] ${iconClass}`}>
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#172033]">{title}</h2>
            <p className="mt-1 text-sm text-[#64748B]">{hint}</p>
          </div>
        </div>
        <span className="rounded-[3px] bg-[#F8FAFC] px-2 py-0.5 text-xs font-medium text-[#64748B]">
          {members.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {members.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">No one assigned yet.</p>
        ) : (
          members.map((member) => (
            <PersonChip
              key={`${member.userId}-${member.team}`}
              person={member}
              onRemove={canEdit ? () => remove(member.userId, member.name) : undefined}
            />
          ))
        )}
      </div>

      {canEdit ? (
        <div className="mt-4 flex items-center gap-2">
          <Plus size={14} className="text-[#64748B]" />
          <CustomSelect
            compact
            ariaLabel={`Add to ${title}`}
            value={pick}
            options={options.length > 1 ? options : [{ value: "", label: "Everyone is already on this team" }]}
            onChange={(value) => add(value)}
          />
        </div>
      ) : null}
    </section>
  );
}

export function ProjectTeams({
  projectId,
  people,
  members,
  canEdit,
}: {
  projectId: string;
  people: Person[];
  members: ProjectMember[];
  canEdit: boolean;
}) {
  const developers = members.filter((member) => member.team === "developer");
  const testers = members.filter((member) => member.team === "testing");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TeamCard
        projectId={projectId}
        team="developer"
        title="Developer team"
        hint="People who build tasks, fixes, and product work on this project."
        icon={Code2}
        iconClass="bg-[#EFF6FF] text-[#2563EB]"
        people={people}
        members={developers}
        canEdit={canEdit}
      />
      <TeamCard
        projectId={projectId}
        team="testing"
        title="Testing team"
        hint="People who write cases, run tests, and record pass or fail here."
        icon={ClipboardCheck}
        iconClass="bg-[#F5F3FF] text-[#7C3AED]"
        people={people}
        members={testers}
        canEdit={canEdit}
      />
    </div>
  );
}
