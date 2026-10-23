"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Text } from "@/components/ui/text"
import { toast } from "@/hooks/use-toast"
import {
  APPLICATION_COLUMNS,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  columnDroppableId,
  parseColumnDroppableId,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications"
import { cn } from "@/lib/utils"

const VIEW_KEY = "wg-tracker-view"

function subscribeView(onStoreChange: () => void) {
  window.addEventListener("wg-tracker-view", onStoreChange)
  window.addEventListener("storage", onStoreChange)
  const media = window.matchMedia("(max-width: 767px)")
  media.addEventListener("change", onStoreChange)
  return () => {
    window.removeEventListener("wg-tracker-view", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
    media.removeEventListener("change", onStoreChange)
  }
}

function viewSnapshot(): "board" | "table" {
  const stored = window.localStorage.getItem(VIEW_KEY)
  if (stored === "board" || stored === "table") return stored
  return window.matchMedia("(max-width: 767px)").matches ? "table" : "board"
}

function daysBetween(iso: string | null | undefined): number | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000))
}

function stageAge(application: Application): string {
  const days = daysBetween(application.updated_at || application.applied_date)
  const label = APPLICATION_STATUS_LABELS[application.status].toLowerCase()
  if (days == null) return `In ${label}`
  return `In ${label} ${days} ${days === 1 ? "day" : "days"}`
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
}

async function patchApplication(id: string, body: Record<string, unknown>): Promise<Application> {
  const res = await fetch(`/api/applications/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { ok?: boolean; application?: Application; error?: string }
  if (!res.ok || !data.ok || !data.application) throw new Error(data.error || "Could not update that application.")
  return data.application
}

export function TrackerBoard({
  initial,
  loadError,
  initialSelectedId,
}: {
  initial: Application[]
  loadError: string | null
  initialSelectedId: string | null
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const viewChoice = useSyncExternalStore(subscribeView, viewSnapshot, () => "board" as const)
  const [rows, setRows] = useState(initial)
  const [selected, setSelected] = useState<string[]>([])
  const [detailId, setDetailId] = useState<string | null>(initialSelectedId)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all")
  const [sortKey, setSortKey] = useState<"updated" | "company" | "role">("updated")
  const [quickCompany, setQuickCompany] = useState("")
  const [quickRole, setQuickRole] = useState("")
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus | "">("")
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [overId, setOverId] = useState<string | null>(null)

  const detail = rows.find((row) => row.id === detailId) ?? null
  const visible = useMemo(() => {
    const filtered = statusFilter === "all" ? rows : rows.filter((row) => row.status === statusFilter)
    return [...filtered].sort((a, b) => {
      if (sortKey === "company") return a.company.localeCompare(b.company)
      if (sortKey === "role") return a.role.localeCompare(b.role)
      return b.updated_at.localeCompare(a.updated_at)
    })
  }, [rows, sortKey, statusFilter])

  function setView(next: "board" | "table") {
    window.localStorage.setItem(VIEW_KEY, next)
    window.dispatchEvent(new Event("wg-tracker-view"))
  }

  async function move(id: string, status: ApplicationStatus) {
    const previous = rows
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)))
    try {
      const saved = await patchApplication(id, { status })
      setRows((current) => current.map((row) => (row.id === id ? saved : row)))
    } catch {
      setRows(previous)
      toast({ title: "Could not move that application", description: "It is back in the previous stage.", variant: "error" })
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setOverId(null)
    const status = parseColumnDroppableId(String(event.over?.id ?? "")) ?? (event.over?.data.current?.status as ApplicationStatus | undefined)
    if (!status || !APPLICATION_STATUSES.includes(status)) return
    void move(String(event.active.id), status)
  }

  async function quickAdd(event: React.FormEvent) {
    event.preventDefault()
    const company = quickCompany.trim()
    const role = quickRole.trim()
    if (!company || !role) return
    const res = await fetch("/api/applications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, role, status: "applied" }),
    })
    const data = (await res.json()) as { ok?: boolean; application?: Application }
    if (!res.ok || !data.application) {
      toast({ title: "Could not log that application", variant: "error" })
      return
    }
    setRows((current) => [data.application!, ...current])
    setQuickCompany("")
    setQuickRole("")
    toast({ title: "Logged the application", variant: "success" })
  }

  async function importCsv(file: File) {
    const text = await file.text()
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    if (lines.length < 2) {
      toast({ title: "The file needs a header and one row", variant: "error" })
      return
    }
    const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase())
    let imported = 0
    let failed = 0
    for (const line of lines.slice(1)) {
      const cells = line.split(",").map((cell) => cell.trim())
      const record: Record<string, string> = {}
      header.forEach((key, index) => {
        record[key] = cells[index] ?? ""
      })
      const status = APPLICATION_STATUSES.includes(record.status as ApplicationStatus) ? (record.status as ApplicationStatus) : "applied"
      const res = await fetch("/api/applications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: record.company,
          role: record.role,
          status,
          applied_date: record.applied_date || undefined,
          job_url: record.job_url || null,
          notes: record.notes || null,
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as { application?: Application }
        if (data.application) {
          imported += 1
          setRows((current) => [data.application!, ...current.filter((row) => row.id !== data.application!.id)])
        } else failed += 1
      } else failed += 1
    }
    toast({
      title: `Imported ${imported} ${imported === 1 ? "application" : "applications"}`,
      description: failed > 0 ? `${failed} rows were skipped.` : "Quoted commas in a cell are not parsed.",
      variant: failed > 0 ? "error" : "success",
    })
  }

  async function applyBulk() {
    if (!bulkStatus) return
    const ids = [...selected]
    setConfirmBulk(false)
    let failed = 0
    for (const id of ids) {
      try {
        const saved = await patchApplication(id, { status: bulkStatus })
        setRows((current) => current.map((row) => (row.id === id ? saved : row)))
      } catch {
        failed += 1
      }
    }
    setSelected([])
    toast({
      title: failed === 0 ? `Updated ${ids.length} applications` : `Updated ${ids.length - failed} of ${ids.length}`,
      variant: failed === 0 ? "success" : "error",
    })
  }

  const movedPastApplied = rows.filter((row) => row.status === "screening" || row.status === "interview" || row.status === "offer").length
  const updateDays = rows
    .filter((row) => row.status !== "applied")
    .map((row) => daysBetween(row.applied_date))
    .filter((value): value is number => value != null)
  const medianDays = median(updateDays)

  const board = (
    <DndContext sensors={sensors} onDragEnd={onDragEnd} onDragOver={(event) => setOverId(event.over ? String(event.over.id) : null)}>
      <div className="grid gap-3 md:grid-cols-5">
        {APPLICATION_COLUMNS.map((column) => (
          <Column key={column.id} status={column.id} active={overId === columnDroppableId(column.id)}>
            {visible.filter((row) => row.status === column.id).map((row) => (
              <TrackerCard
                key={row.id}
                application={row}
                selected={selected.includes(row.id)}
                onToggle={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])}
                onOpen={() => setDetailId(row.id)}
                onMove={(status) => void move(row.id, status)}
              />
            ))}
          </Column>
        ))}
      </div>
    </DndContext>
  )

  const table = (
    <div className="overflow-x-auto rounded-card border border-hairline">
      <table className="w-full min-w-[40rem] text-left text-role-caption">
        <thead className="bg-surface-sunken">
          <tr>
            <th className="p-2" />
            <th className="p-2">Role</th>
            <th className="p-2">Company</th>
            <th className="p-2">Stage</th>
            <th className="p-2">Age</th>
            <th className="p-2">Next step</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.id} className="border-t border-hairline">
              <td className="p-2">
                <input type="checkbox" aria-label={`Select ${row.role}`} checked={selected.includes(row.id)} onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} />
              </td>
              <td className="p-2"><button type="button" className="min-h-11 text-left" onClick={() => setDetailId(row.id)}>{row.role}</button></td>
              <td className="p-2">{row.company}</td>
              <td className="p-2">
                <select className="min-h-11 bg-surface" aria-label={`Stage for ${row.role}`} value={row.status} onChange={(event) => void move(row.id, event.target.value as ApplicationStatus)}>
                  {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}
                </select>
              </td>
              <td className="p-2">{stageAge(row)}</td>
              <td className="p-2">{row.next_step || "No next step"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <main className="space-y-4 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Text as="h2" role="heading">Tracker</Text>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant={viewChoice === "board" ? "default" : "outline"} className="min-h-11" onClick={() => setView("board")}>Board</Button>
          <Button type="button" variant={viewChoice === "table" ? "default" : "outline"} className="min-h-11" onClick={() => setView("table")}>Table</Button>
        </div>
      </div>
      <form className="flex flex-wrap gap-2" onSubmit={(event) => void quickAdd(event)}>
        <Input className="min-h-11 max-w-xs" aria-label="Company" placeholder="Company" value={quickCompany} onChange={(event) => setQuickCompany(event.target.value)} />
        <Input className="min-h-11 max-w-xs" aria-label="Role" placeholder="Role" value={quickRole} onChange={(event) => setQuickRole(event.target.value)} />
        <Button type="submit" className="min-h-11">Log application</Button>
        <label className="inline-flex min-h-11 items-center text-role-caption text-ink-muted">
          Import CSV
          <input className="ml-2" type="file" accept=".csv,text/csv" aria-label="CSV import" onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void importCsv(file)
          }} />
        </label>
      </form>
      <div className="flex flex-wrap gap-2">
        <label className="text-role-caption text-ink-muted">
          Filter
          <select className="ml-2 min-h-11 bg-surface" value={statusFilter} aria-label="Filter by stage" onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | "all")}>
            <option value="all">All stages</option>
            {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}
          </select>
        </label>
        <label className="text-role-caption text-ink-muted">
          Sort
          <select className="ml-2 min-h-11 bg-surface" value={sortKey} aria-label="Sort applications" onChange={(event) => setSortKey(event.target.value as "updated" | "company" | "role")}>
            <option value="updated">Latest update</option>
            <option value="company">Company</option>
            <option value="role">Role</option>
          </select>
        </label>
        {selected.length > 0 ? (
          <>
            <select className="min-h-11 bg-surface" aria-label="Bulk stage" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ApplicationStatus | "")}>
              <option value="">Move selected to…</option>
              {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}
            </select>
            <Button type="button" className="min-h-11" disabled={!bulkStatus} onClick={() => setConfirmBulk(true)}>Update {selected.length}</Button>
          </>
        ) : null}
      </div>
      {confirmBulk && bulkStatus ? (
        <div className="rounded-card border border-hairline bg-surface-raised p-3" role="status">
          <Text role="body-small">This updates {selected.length} {selected.length === 1 ? "application" : "applications"} to {APPLICATION_STATUS_LABELS[bulkStatus]}.</Text>
          <div className="mt-2 flex gap-2">
            <Button type="button" className="min-h-11" onClick={() => void applyBulk()}>Confirm</Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setConfirmBulk(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}
      {loadError ? <Text role="body" className="text-danger">{loadError}</Text> : null}
      {!loadError && rows.length === 0 ? (
        <div className="rounded-card border border-hairline p-4">
          <Text role="body">Applications you log will show up here.</Text>
          <Link href="/jobs" className="mt-2 inline-flex min-h-11 items-center text-accent">Find a role</Link>
          <Text role="caption" className="mt-2 text-ink-muted">Or import a CSV with columns company, role, status, applied_date, job_url, notes.</Text>
        </div>
      ) : null}
      {rows.length > 0 && viewChoice === "board" ? board : null}
      {rows.length > 0 && viewChoice === "table" ? table : null}
      <section className="rounded-card border border-hairline bg-surface-raised p-3">
        <Text as="h3" role="subheading">What the tracker can measure</Text>
        <ul className="mt-2 space-y-2 text-role-body-small">
          <li>{rows.length} logged {rows.length === 1 ? "application" : "applications"}.</li>
          <li>{movedPastApplied} moved past Applied. That count is not a response rate.</li>
          <li>{medianDays == null ? "Not enough stage changes to describe a median time." : `Median days between the applied date and the last update, for applications that left Applied: ${medianDays}. This is not an employer response time.`}</li>
          <li>A platform median is not available.</li>
          <li>Resume versions are not stored on applications, so there is no comparison of which resume performs better.</li>
        </ul>
      </section>
      {detail ? (
        <div className="fixed inset-y-0 right-0 z-modal w-full max-w-md overflow-auto border-l border-hairline bg-surface-raised p-4 shadow-overlay" role="dialog" aria-label="Application detail">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Text as="h2" role="subheading">{detail.role}</Text>
              <Text role="body-small" className="text-ink-muted">{detail.company}</Text>
            </div>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setDetailId(null)}>Close</Button>
          </div>
          <Text role="body-small" className="mt-3">{stageAge(detail)}</Text>
          {(daysBetween(detail.updated_at) ?? 0) >= 21 ? (
            <Text role="caption" className="text-ink-muted">No update recorded in {daysBetween(detail.updated_at)} days.</Text>
          ) : null}
          <Text role="body-small" className="mt-3">Next step: {detail.next_step || "None recorded"}</Text>
          <Text role="body-small">Next step date: {detail.next_step_date || "None recorded"}{detail.next_step && /interview/i.test(detail.next_step) ? "" : ". Interview rounds are not stored separately."}</Text>
          <Text role="body-small">Contact: {detail.contact_person || "None recorded"}</Text>
          <Text role="body-small">Documents used: none are stored on this application.</Text>
          <Text as="h3" role="subheading" className="mt-4">Timeline</Text>
          {detail.timeline.length === 0 ? <Text role="caption">No timeline events are stored.</Text> : (
            <ul className="mt-2 space-y-1">
              {detail.timeline.map((event) => (
                <li key={event.id} className="text-role-caption">{event.label} · {event.at.slice(0, 10)}</li>
              ))}
            </ul>
          )}
          <label className="mt-4 block text-role-caption text-ink-muted">
            Notes
            <Textarea className="mt-1" defaultValue={detail.notes ?? ""} onBlur={(event) => {
              const notes = event.target.value
              void patchApplication(detail.id, { notes }).then((saved) => {
                setRows((current) => current.map((row) => (row.id === saved.id ? saved : row)))
              }).catch(() => toast({ title: "Could not save the note", variant: "error" }))
            }} />
          </label>
        </div>
      ) : null}
      <Text role="caption" className="text-ink-subtle">
        The applications page at <Link href="/applications" className="text-accent">/applications</Link> is unchanged.
      </Text>
    </main>
  )
}

function Column({ status, active, children }: { status: ApplicationStatus; active: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: columnDroppableId(status), data: { type: "column", status } })
  return (
    <section ref={setNodeRef} className={cn("min-h-40 rounded-card border bg-surface p-2", active ? "border-accent ring-2 ring-accent" : "border-hairline")}>
      <Text role="caption" className="text-ink-muted">{APPLICATION_STATUS_LABELS[status]}</Text>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}

function TrackerCard({
  application,
  selected,
  onToggle,
  onOpen,
  onMove,
}: {
  application: Application
  selected: boolean
  onToggle: () => void
  onOpen: () => void
  onMove: (status: ApplicationStatus) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id })
  const quiet = (daysBetween(application.updated_at) ?? 0) >= 21
  return (
    <article ref={setNodeRef} className={cn("rounded-card border border-hairline bg-surface-raised p-2", isDragging && "opacity-60")}>
      <div className="flex items-start gap-2">
        <input type="checkbox" aria-label={`Select ${application.role}`} checked={selected} onChange={onToggle} />
        <button type="button" className="min-h-11 flex-1 text-left" onClick={onOpen}>
          <span className="block text-role-body-small font-medium">{application.role}</span>
          <span className="block text-role-caption text-ink-muted">{application.company}</span>
        </button>
        <button type="button" className="min-h-11 min-w-11 text-role-caption text-ink-muted" aria-label={`Drag ${application.role}`} {...listeners} {...attributes}>Move</button>
      </div>
      <p className="text-role-caption">{stageAge(application)}</p>
      <p className="text-role-caption text-ink-muted">Next: {application.next_step || "None recorded"}</p>
      <p className="text-role-caption text-ink-muted">
        {application.next_step_date ? `Next step date ${application.next_step_date}` : "No next step date"}
      </p>
      {quiet ? <p className="text-role-caption text-ink-muted">No update recorded recently.</p> : null}
      <label className="mt-1 block text-role-caption text-ink-subtle">
        Stage
        <select className="mt-1 block min-h-11 w-full bg-surface" value={application.status} aria-label={`Stage for ${application.role}`} onChange={(event) => onMove(event.target.value as ApplicationStatus)}>
          {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}
        </select>
      </label>
    </article>
  )
}
