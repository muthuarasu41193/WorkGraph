/**
 * Find account-owner columns declared in supabase/migrations SQL.
 * Comments are ignored. A column counts when its name is an owner id
 * used in this schema, or when the column references auth.users.
 */

const OWNER_NAMES = new Set([
  "user_id",
  "owner_user_id",
  "owner_id",
  "seller_id",
  "buyer_id",
  "seeker_id",
  "employer_id",
]);

export type MigrationFile = { name: string; sql: string };

export function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

function addOwner(owners: Map<string, Set<string>>, table: string, column: string): void {
  const key = table.toLowerCase();
  const name = column.toLowerCase().replace(/"/g, "");
  if (!/^[a-z_][a-z0-9_]*$/.test(key) || !/^[a-z_][a-z0-9_]*$/.test(name)) return;
  let columns = owners.get(key);
  if (!columns) {
    columns = new Set();
    owners.set(key, columns);
  }
  columns.add(name);
}

function splitAtDepthZero(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function columnName(definition: string): string | null {
  const trimmed = definition.trim();
  if (!trimmed) return null;
  if (/^(constraint|primary|unique|check|foreign|exclude)\b/i.test(trimmed)) return null;
  const name = trimmed.split(/\s+/)[0]?.replace(/"/g, "") ?? "";
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : null;
}

function recordColumn(owners: Map<string, Set<string>>, table: string, definition: string): void {
  const name = columnName(definition);
  if (!name) {
    const foreign = definition.match(/foreign\s+key\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/i);
    if (foreign && /references\s+auth\.users\b/i.test(definition)) {
      addOwner(owners, table, foreign[1]);
    }
    return;
  }
  if (OWNER_NAMES.has(name.toLowerCase()) || /references\s+auth\.users\b/i.test(definition)) {
    addOwner(owners, table, name);
  }
}

function createTableBodies(sql: string): Array<{ table: string; body: string }> {
  const found: Array<{ table: string; body: string }> = [];
  const matcher = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/gi;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(sql))) {
    const start = match.index + match[0].length;
    let depth = 1;
    let index = start;
    while (index < sql.length && depth > 0) {
      if (sql[index] === "(") depth += 1;
      else if (sql[index] === ")") depth -= 1;
      index += 1;
    }
    found.push({ table: match[1], body: sql.slice(start, index - 1) });
    matcher.lastIndex = index;
  }
  return found;
}

export function ownerColumnsByTable(files: readonly MigrationFile[]): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>();
  for (const file of files) {
    const sql = stripSqlComments(file.sql);
    for (const created of createTableBodies(sql)) {
      for (const column of splitAtDepthZero(created.body)) {
        recordColumn(owners, created.table, column);
      }
    }
    const altered =
      /alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([A-Za-z_][A-Za-z0-9_]*)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?([A-Za-z_][A-Za-z0-9_]*)\s+([^;]*)/gi;
    let alter: RegExpExecArray | null;
    while ((alter = altered.exec(sql))) {
      recordColumn(owners, alter[1], `${alter[2]} ${alter[3]}`);
    }
  }
  return owners;
}
