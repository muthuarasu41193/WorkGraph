import SectionHeader from "@/components/design-system/SectionHeader";
import type { ComponentProps } from "react";

/** Profile sections use the bordered variant by default */
export default function ProfileSectionHeader(
  props: Omit<ComponentProps<typeof SectionHeader>, "variant"> & { variant?: "default" | "bordered" },
) {
  return <SectionHeader variant="bordered" {...props} />;
}
