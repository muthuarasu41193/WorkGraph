"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useDashboardStore } from "../../stores/dashboard-store";
import CommunityPanel from "../community/CommunityPanel";
import WalletPanel from "../wallet/WalletPanel";
import type { ReactNode } from "react";

type Props = {
  overview: ReactNode;
  workgraphEnabled?: boolean;
};

export default function DashboardTabs({ overview, workgraphEnabled = false }: Props) {
  const activeTab = useDashboardStore((s) => s.activeTab);
  const setActiveTab = useDashboardStore((s) => s.setActiveTab);

  if (!workgraphEnabled) {
    return <>{overview}</>;
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "overview" | "community" | "wallet")}
    >
      <TabsList className="mb-6 w-full justify-start bg-muted/50 sm:w-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="community">Community</TabsTrigger>
        <TabsTrigger value="wallet">Wallet</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="community">
        <CommunityPanel />
      </TabsContent>
      <TabsContent value="wallet">
        <WalletPanel />
      </TabsContent>
    </Tabs>
  );
}
