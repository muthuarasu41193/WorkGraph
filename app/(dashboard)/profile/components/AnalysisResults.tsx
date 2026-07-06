"use client";

import { useMemo } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import ScoreVisualization from "@/app/(dashboard)/profile/components/ScoreVisualization";

export type ResumeAnalysis = {
  atsScore: number;
  matchScore: number | null;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  tips: string[];
  summary: string;
};

type AnalysisResultsProps = {
  analysis: ResumeAnalysis;
};

function renderList(items: string[]) {
  if (!items.length) return <p className="text-body text-muted-foreground">No suggestions yet.</p>;
  return (
    <ul className="space-y-2 text-body">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-md border bg-muted/30 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const copyBlock = useMemo(() => {
    return [
      "Resume Analyzer Feedback (Advisory Only)",
      "",
      `ATS Score: ${analysis.atsScore}/100`,
      analysis.matchScore != null ? `Match Score: ${analysis.matchScore}/100` : null,
      "",
      "Summary:",
      analysis.summary,
      "",
      "Strengths:",
      ...analysis.strengths.map((item) => `- ${item}`),
      "",
      "Improvements:",
      ...analysis.improvements.map((item) => `- ${item}`),
      "",
      "Missing Keywords:",
      ...analysis.missingKeywords.map((item) => `- ${item}`),
      "",
      "Tips:",
      ...analysis.tips.map((item) => `- ${item}`),
    ]
      .filter(Boolean)
      .join("\n");
  }, [analysis]);

  async function copySuggestions() {
    try {
      await navigator.clipboard.writeText(copyBlock);
      toast({ title: "Copied suggestions", variant: "success" });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard permission was blocked. Copy manually from the tabs below.",
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-body-lg">Overall Summary</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={copySuggestions}>
            <Copy className="h-4 w-4" />
            Copy Suggestions
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-body leading-6 text-muted-foreground">{analysis.summary}</p>
        </CardContent>
      </Card>

      <div className={analysis.matchScore != null ? "grid gap-3 sm:grid-cols-2" : "max-w-[220px]"}>
        <ScoreVisualization value={analysis.atsScore} label="ATS Score" />
        {analysis.matchScore != null ? <ScoreVisualization value={analysis.matchScore} label="Match Score" /> : null}
      </div>

      <Tabs defaultValue="strengths" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="strengths">✅ Strengths</TabsTrigger>
          <TabsTrigger value="improvements">⚠️ Improvements</TabsTrigger>
          <TabsTrigger value="keywords">🔑 Keywords</TabsTrigger>
          <TabsTrigger value="tips">💡 Tips</TabsTrigger>
        </TabsList>
        <TabsContent value="strengths">{renderList(analysis.strengths)}</TabsContent>
        <TabsContent value="improvements">{renderList(analysis.improvements)}</TabsContent>
        <TabsContent value="keywords">{renderList(analysis.missingKeywords)}</TabsContent>
        <TabsContent value="tips">{renderList(analysis.tips)}</TabsContent>
      </Tabs>
    </div>
  );
}

