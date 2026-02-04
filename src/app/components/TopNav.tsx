"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlaneTakeoff, ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "flights", href: "/", label: "Flights", icon: PlaneTakeoff },
  {
    value: "airlines",
    href: "/airlines",
    label: "Pole-approved airlines",
    icon: ShieldCheck,
  },
];

export default function TopNav() {
  const pathname = usePathname();
  const activeValue = pathname === "/airlines" ? "airlines" : "flights";

  return (
    <Tabs value={activeValue} className="w-full sm:w-auto">
      <TabsList
        variant="line"
        className="grid w-full grid-cols-2 bg-transparent sm:w-[360px]"
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link href={tab.href} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4 text-muted-foreground" />
              <span>{tab.label}</span>
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
