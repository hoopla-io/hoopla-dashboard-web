import { SettlementsPanel } from "@/app/(dashboard)/settlements/SettlementsPanel";

interface SettlementsTabProps {
  partnerId: number;
}

export function SettlementsTab({ partnerId }: SettlementsTabProps) {
  return <SettlementsPanel partnerId={partnerId} />;
}
