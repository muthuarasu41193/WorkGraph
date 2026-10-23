"use client"

import { useState, type ReactNode } from "react"
import { Bookmark } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Pagination } from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider, RangeSlider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeleton } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import type { PreviewState } from "@/lib/primitive"

const OPTIONS = [
  { value: "design", label: "Product design" },
  { value: "eng", label: "Engineering" },
  { value: "ops", label: "Operations", disabled: true },
]

function Label({ children }: { children: string }) {
  return <p className="text-role-caption text-ink-subtle">{children}</p>
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-hairline py-4">
      <h3 className="text-role-subheading text-ink">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </section>
  )
}

function ButtonRow() {
  const previews: PreviewState[] = ["hover", "active", "focus", "disabled", "loading", "error"]
  return (
    <div className="flex flex-wrap gap-2">
      <div>
        <Label>Default</Label>
        <Button className="min-h-11">Save</Button>
      </div>
      {previews.map((preview) => (
        <div key={preview}>
          <Label>{preview}</Label>
          <Button preview={preview} className="min-h-11">Save</Button>
        </div>
      ))}
      <div>
        <Label>Selected</Label>
        <Button aria-pressed="true" className="min-h-11">Saved</Button>
      </div>
    </div>
  )
}

function Board() {
  const [page, setPage] = useState(2)
  return (
    <TooltipProvider>
      <div className="space-y-1">
        <Block title="Button">
          <ButtonRow />
        </Block>
        <Block title="IconButton">
          <div className="flex gap-2">
            <IconButton label="Save job" className="min-h-11 min-w-11"><Bookmark className="size-4" /></IconButton>
            <IconButton label="Save job" preview="disabled" className="min-h-11 min-w-11"><Bookmark className="size-4" /></IconButton>
            <IconButton label="Save job" preview="loading" className="min-h-11 min-w-11"><Bookmark className="size-4" /></IconButton>
            <IconButton label="Save job" preview="error" className="min-h-11 min-w-11"><Bookmark className="size-4" /></IconButton>
          </div>
        </Block>
        <Block title="Input">
          <Input aria-label="Role" placeholder="Role" className="min-h-11" />
          <Input aria-label="Role hover" preview="hover" placeholder="Hover" className="min-h-11" />
          <Input aria-label="Role focus" preview="focus" placeholder="Focus" className="min-h-11" />
          <Input aria-label="Role disabled" preview="disabled" placeholder="Disabled" className="min-h-11" />
          <Input aria-label="Role loading" preview="loading" placeholder="Loading" className="min-h-11" />
          <Input aria-label="Role error" preview="error" placeholder="Error" className="min-h-11" />
          <Input aria-label="Role readonly" preview="readonly" defaultValue="Read only" className="min-h-11" />
        </Block>
        <Block title="Textarea">
          <Textarea aria-label="Notes" placeholder="Notes" />
          <Textarea aria-label="Notes disabled" preview="disabled" placeholder="Disabled" />
          <Textarea aria-label="Notes error" preview="error" placeholder="Error" />
          <Textarea aria-label="Notes readonly" preview="readonly" defaultValue="Read only notes" />
          <Textarea aria-label="Notes loading" preview="loading" placeholder="Loading" />
        </Block>
        <Block title="Select">
          <Select>
            <SelectTrigger aria-label="Seniority" className="min-h-11"><SelectValue placeholder="Seniority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mid">Mid</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
          <Select disabled>
            <SelectTrigger aria-label="Seniority disabled" className="min-h-11"><SelectValue placeholder="Disabled" /></SelectTrigger>
            <SelectContent><SelectItem value="mid">Mid</SelectItem></SelectContent>
          </Select>
        </Block>
        <Block title="Combobox">
          <Combobox options={OPTIONS} placeholder="Search functions" />
          <Combobox options={OPTIONS} preview="disabled" placeholder="Disabled" />
          <Combobox options={OPTIONS} preview="loading" />
          <Combobox options={OPTIONS} preview="error" />
          <Combobox options={OPTIONS} preview="readonly" value="design" />
        </Block>
        <Block title="MultiSelect">
          <MultiSelect options={OPTIONS} placeholder="Functions" />
          <MultiSelect options={OPTIONS} preview="disabled" value={["design"]} />
          <MultiSelect options={OPTIONS} preview="loading" />
          <MultiSelect options={OPTIONS} preview="error" />
          <MultiSelect options={OPTIONS} preview="readonly" value={["eng"]} />
        </Block>
        <Block title="Checkbox">
          <label className="flex min-h-11 items-center gap-2 text-role-body-small"><Checkbox aria-label="Remote" /> Remote</label>
          <label className="flex min-h-11 items-center gap-2 text-role-body-small"><Checkbox defaultChecked aria-label="Selected" /> Selected</label>
          <label className="flex min-h-11 items-center gap-2 text-role-body-small"><Checkbox disabled aria-label="Disabled" /> Disabled</label>
          <label className="flex min-h-11 items-center gap-2 text-role-body-small"><Checkbox aria-invalid aria-label="Error" /> Error</label>
        </Block>
        <Block title="RadioGroup">
          <RadioGroup defaultValue="onsite" aria-label="Workplace">
            <label className="flex min-h-11 items-center gap-2 text-role-body-small"><RadioGroupItem value="onsite" /> On-site</label>
            <label className="flex min-h-11 items-center gap-2 text-role-body-small"><RadioGroupItem value="remote" /> Remote</label>
          </RadioGroup>
          <RadioGroup preview="disabled" defaultValue="onsite" aria-label="Workplace disabled">
            <label className="flex min-h-11 items-center gap-2"><RadioGroupItem value="onsite" /> Disabled</label>
          </RadioGroup>
          <RadioGroup preview="error" aria-label="Workplace error">
            <label className="flex min-h-11 items-center gap-2"><RadioGroupItem value="onsite" /> Error</label>
          </RadioGroup>
        </Block>
        <Block title="Switch">
          <Switch aria-label="Alerts" />
          <Switch aria-label="Alerts on" defaultChecked />
          <Switch aria-label="Alerts disabled" preview="disabled" />
          <Switch aria-label="Alerts error" preview="error" />
          <Switch aria-label="Alerts loading" preview="loading" />
        </Block>
        <Block title="Slider">
          <Slider defaultValue={[40]} aria-label="Match floor" />
          <Slider defaultValue={[40]} preview="disabled" aria-label="Disabled" />
          <Slider defaultValue={[40]} preview="error" error aria-label="Error" />
          <Slider defaultValue={[40]} readOnly aria-label="Read only" />
        </Block>
        <Block title="RangeSlider">
          <RangeSlider defaultValue={[20, 80]} aria-label="Salary range" />
          <RangeSlider defaultValue={[20, 80]} preview="disabled" aria-label="Disabled range" />
          <RangeSlider defaultValue={[20, 80]} preview="error" error aria-label="Error range" />
        </Block>
        <Block title="DatePicker">
          <DatePicker />
          <DatePicker preview="disabled" />
          <DatePicker preview="loading" />
          <DatePicker preview="error" />
          <DatePicker preview="readonly" value="2026-10-23" />
        </Block>
        <Block title="Dialog">
          <Dialog>
            <DialogTrigger asChild><Button className="min-h-11">Open dialog</Button></DialogTrigger>
            <DialogContent>
              <DialogTitle>Confirm apply</DialogTitle>
              <DialogDescription>This leaves WorkGraph and opens the employer form.</DialogDescription>
            </DialogContent>
          </Dialog>
          <div className="rounded-overlay border border-hairline bg-surface-raised p-4 shadow-overlay">
            <p className="text-role-subheading">Open state</p>
            <p className="measure text-role-body-small text-ink-muted">Focus stays inside. Escape closes. Focus returns to the trigger.</p>
          </div>
        </Block>
        <Block title="Sheet">
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" className="min-h-11">Open sheet</Button></SheetTrigger>
            <SheetContent>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Remote, salary, and freshness.</SheetDescription>
            </SheetContent>
          </Sheet>
        </Block>
        <Block title="Drawer">
          <Drawer>
            <DrawerTrigger asChild><Button variant="outline" className="min-h-11">Open drawer</Button></DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Job actions</DrawerTitle>
              <DrawerDescription>Save, dismiss, or apply without leaving the list.</DrawerDescription>
            </DrawerContent>
          </Drawer>
        </Block>
        <Block title="Popover">
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" className="min-h-11">Open popover</Button></PopoverTrigger>
            <PopoverContent>Salary is the employer’s posted range.</PopoverContent>
          </Popover>
        </Block>
        <Block title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild><Button variant="ghost" className="min-h-11">Hint</Button></TooltipTrigger>
            <TooltipContent>Full job title</TooltipContent>
          </Tooltip>
        </Block>
        <Block title="DropdownMenu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="min-h-11">Menu</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Save</DropdownMenuItem>
              <DropdownMenuItem>Dismiss</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Block>
        <Block title="Toast">
          <Button className="min-h-11" onClick={() => toast({ title: "Saved", description: "Harbor Ledger is in your list.", variant: "success" })}>Success toast</Button>
          <Button variant="destructive" className="min-h-11" onClick={() => toast({ title: "Could not save", variant: "error" })}>Error toast</Button>
          <Button variant="secondary" className="min-h-11" onClick={() => toast({ title: "Note", description: "Nothing was sent.", variant: "default" })}>Default toast</Button>
        </Block>
        <Block title="Tabs">
          <Tabs defaultValue="feed">
            <TabsList>
              <TabsTrigger value="feed" className="min-h-11">Feed</TabsTrigger>
              <TabsTrigger value="saved" className="min-h-11">Saved</TabsTrigger>
              <TabsTrigger value="hidden" disabled className="min-h-11">Disabled</TabsTrigger>
            </TabsList>
            <TabsContent value="feed">Current matches.</TabsContent>
            <TabsContent value="saved">Saved roles.</TabsContent>
          </Tabs>
        </Block>
        <Block title="Accordion">
          <Accordion type="single" collapsible>
            <AccordionItem value="one">
              <AccordionTrigger>Requirements</AccordionTrigger>
              <AccordionContent>Editing is met. SQL is not.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="two">
              <AccordionTrigger preview="disabled">Disabled section</AccordionTrigger>
              <AccordionContent>Hidden.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="three">
              <AccordionTrigger preview="error">Error section</AccordionTrigger>
              <AccordionContent>Could not load.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Block>
        <Block title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Error</Badge>
          </div>
        </Block>
        <Block title="Avatar">
          <Avatar><AvatarFallback>HL</AvatarFallback></Avatar>
        </Block>
        <Block title="Progress">
          <Progress value={72} aria-label="Profile completeness" />
        </Block>
        <Block title="Skeleton">
          <Skeleton className="h-11 w-full" />
        </Block>
        <Block title="Separator">
          <Separator />
        </Block>
        <Block title="Pagination">
          <Pagination page={page} pageCount={4} onPageChange={setPage} />
          <Pagination page={1} pageCount={3} preview="disabled" />
          <Pagination page={1} pageCount={3} preview="loading" />
          <Pagination page={1} pageCount={3} preview="error" />
        </Block>
        <Block title="Breadcrumb">
          <Breadcrumb items={[{ label: "Jobs", href: "/design-system" }, { label: "Harbor Ledger" }]} />
          <Breadcrumb items={[{ label: "Jobs" }]} loading />
          <Breadcrumb items={[{ label: "Jobs" }]} error />
        </Block>
        <Block title="Table">
          <Table>
            <TableHeader><TableRow><TableHead>Role</TableHead><TableHead>Score</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell>Editor</TableCell><TableCell>72</TableCell></TableRow>
              <TableRow data-state="selected"><TableCell>Selected row</TableCell><TableCell>80</TableCell></TableRow>
            </TableBody>
          </Table>
          <TableSkeleton />
          <Table error />
        </Block>
      </div>
    </TooltipProvider>
  )
}

export function PrimitiveGallery() {
  const frames = [
    { theme: "light" as const, width: 375, label: "Light, mobile" },
    { theme: "light" as const, width: 1280, label: "Light, desktop" },
    { theme: "dark" as const, width: 375, label: "Dark, mobile" },
    { theme: "dark" as const, width: 1280, label: "Dark, desktop" },
  ]
  return (
    <div className="space-y-8 bg-surface p-4 text-ink">
      <header className="measure">
        <h1 className="text-role-title">Design system</h1>
        <p className="text-role-body text-ink-muted">
          Every primitive and product composite, in each state, in light and dark, at mobile and desktop width.
        </p>
      </header>
      {frames.map((frame) => (
        <section key={frame.label} className="space-y-2" aria-label={frame.label}>
          <h2 className="text-role-heading">{frame.label}</h2>
          <div
            data-theme={frame.theme}
            className={frame.theme === "dark" ? "dark overflow-x-auto border border-hairline bg-surface p-3 text-ink" : "overflow-x-auto border border-hairline bg-surface p-3 text-ink"}
            style={{ width: frame.width, maxWidth: "100%" }}
          >
            <Board />
          </div>
        </section>
      ))}
    </div>
  )
}
