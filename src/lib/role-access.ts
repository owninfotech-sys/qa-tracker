import { cache } from "react";
import { execute, query } from "@/lib/db";
import {
  ACCESS_KEYS,
  type AccessKey,
  defaultCaps,
  normalizeCaps,
} from "@/lib/access";

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS qa_role_access (
  role varchar(40) NOT NULL,
  capability varchar(40) NOT NULL,
  PRIMARY KEY (role, capability)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

type AccessRow = { role: string; capability: string };

async function ensureTable() {
  await execute(CREATE_TABLE);
}

export const loadRoleAccessMap = cache(async () => {
  await ensureTable();
  const rows = await query<AccessRow>("SELECT role, capability FROM qa_role_access");
  if (!rows.length) {
    const values: unknown[] = [];
    const tuples: string[] = [];
    for (const [role, caps] of Object.entries({
      ADMIN: defaultCaps("ADMIN"),
      PL: defaultCaps("PL"),
      Developer: defaultCaps("Developer"),
      Designer: defaultCaps("Designer"),
      TESTER: defaultCaps("TESTER"),
      FIXER: defaultCaps("FIXER"),
      Teacher: defaultCaps("Teacher"),
      Tutor: defaultCaps("Tutor"),
    })) {
      for (const cap of caps) {
        tuples.push("(?, ?)");
        values.push(role, cap);
      }
    }
    if (tuples.length) {
      await execute(`INSERT INTO qa_role_access (role, capability) VALUES ${tuples.join(", ")}`, values);
    }
    const seeded = await query<AccessRow>("SELECT role, capability FROM qa_role_access");
    return toMap(seeded);
  }
  return toMap(rows);
});

function toMap(rows: AccessRow[]) {
  const map = new Map<string, AccessKey[]>();
  for (const row of rows) {
    const current = map.get(row.role) ?? [];
    if ((ACCESS_KEYS as readonly string[]).includes(row.capability)) {
      current.push(row.capability as AccessKey);
    }
    map.set(row.role, current);
  }
  for (const [role, caps] of map) {
    map.set(role, normalizeCaps(role, caps));
  }
  return map;
}

export async function roleCaps(role: string): Promise<AccessKey[]> {
  const map = await loadRoleAccessMap();
  const stored = map.get(role);
  return stored ? [...stored] : defaultCaps(role);
}

export async function hasAccess(role: string, key: AccessKey) {
  const caps = await roleCaps(role);
  return caps.includes(key);
}

export async function accessMatrixFor(roles: string[]) {
  const map = await loadRoleAccessMap();
  const matrix: Record<string, AccessKey[]> = {};
  for (const role of roles) {
    matrix[role] = map.get(role) ? [...map.get(role)!] : defaultCaps(role);
  }
  return matrix;
}

export async function replaceRoleAccess(role: string, caps: AccessKey[]) {
  const next = normalizeCaps(role, caps);
  await execute("DELETE FROM qa_role_access WHERE role = ?", [role]);
  if (!next.length) return next;
  const values: unknown[] = [];
  const tuples = next.map((cap) => {
    values.push(role, cap);
    return "(?, ?)";
  });
  await execute(`INSERT INTO qa_role_access (role, capability) VALUES ${tuples.join(", ")}`, values);
  return next;
}
