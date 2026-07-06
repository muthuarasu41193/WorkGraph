/**
 * WorkGraph UI Primitives
 * Single implementation for each base component — import from here or @/components/ui/<name>
 */

export { Alert, AlertDescription, AlertTitle } from "./alert";
export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "./avatar";
export { Badge, badgeVariants } from "./badge";
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
export { Button, buttonVariants } from "./button";
export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants } from "./card";
export { Checkbox } from "./checkbox";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
export {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownGroup,
  DropdownItem,
  DropdownLabel,
  DropdownPortal,
  DropdownRadioGroup,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "./dropdown";
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
export { IconButton } from "./icon-button";
export { Input } from "./input";
export { Label } from "./label";
export {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  ModalTrigger,
} from "./modal";
export { Pagination } from "./pagination";
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover";
export { Progress } from "./progress";
export { RadioGroup, RadioGroupItem } from "./radio-group";
export { ScrollArea, ScrollBar } from "./scroll-area";
export { Search } from "./search";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";
export { Separator } from "./separator";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
export { Skeleton } from "./skeleton";
export { Spinner, spinnerVariants } from "./spinner";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
export { Tag, tagVariants } from "./tag";
export { Textarea } from "./textarea";
export { toast, Toaster } from "./toast";
export { Toggle } from "./toggle";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

/** Alias for Skeleton — loading placeholder blocks */
export { Skeleton as LoadingSkeleton } from "./skeleton";
