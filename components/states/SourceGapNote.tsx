import { Text } from "@/components/ui/text"

export function SourceGapNote({ source }: { source: string }) {
  return (
    <div className="rounded-card border border-hairline bg-caution-wash px-3 py-2" role="status">
      <Text role="caption" className="text-ink">
        Jobs from {source} did not load. The other sources are still listed.
      </Text>
    </div>
  )
}
