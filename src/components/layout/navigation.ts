import { LayoutDashboard, ChartNoAxesCombined, GitBranch, Network, Lightbulb, Layers3, BadgeDollarSign, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

export type NavigationItem = { label: string; path: string; icon: LucideIcon; children?: NavigationItem[] };

export const navigation: NavigationItem[] = [
  { label: "Overview", path: "/home", icon: LayoutDashboard },
  { label: "Performance", path: "/home/performance", icon: ChartNoAxesCombined },
  { label: "Value Tree", path: "/home/value-tree", icon: GitBranch },
  { label: "Math Tree Cost", path: "/math-tree/cost", icon: Network, children: [
    { label: "Analysis", path: "/math-tree/cost/analysis", icon: ChartNoAxesCombined },
    { label: "Opportunities", path: "/home/opportunities", icon: Lightbulb },
  ] },
  { label: "Initiatives", path: "/home/initiatives", icon: Layers3 },
  { label: "Value Capture", path: "/home/value-capture", icon: BadgeDollarSign },
  { label: "Governance", path: "/home/governance", icon: ShieldCheck },
  { label: "AI Insights", path: "/home/ai-insights", icon: Sparkles },
];

export const findNavigationItem = (pathname: string) => navigation.flatMap(item => [item, ...(item.children ?? [])]).find(item => item.path === pathname);
