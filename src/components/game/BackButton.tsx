"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function BackButton({ href = "/", label = "Back to menu" }: { href?: string; label?: string }) {
  const router = useRouter();
  return (
    <Button variant="ghost" iconLeft={<span aria-hidden="true">←</span>} onClick={() => router.push(href)}>
      {label}
    </Button>
  );
}
