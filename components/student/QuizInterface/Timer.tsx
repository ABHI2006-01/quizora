"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimerProps {
  expiresAt: string | Date;
  onExpire: () => void;
}

export default function Timer({ expiresAt, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ m: number; s: number; total: number }>({ m: 0, s: 0, total: 999 });

  useEffect(() => {
    const expireTime = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expireTime - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({ m: 0, s: 0, total: 0 });
        onExpire();
      } else {
        const total = Math.floor(distance / 1000);
        const m = Math.floor(distance / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ m, s, total });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  // Styling based on time remaining
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
  let iconClass = "text-slate-500";
  let alertMode = false;

  if (timeLeft.total <= 300) {
    // Less than 5 minutes
    colorClass = "bg-red-50 text-red-700 border-red-200 animate-pulse";
    iconClass = "text-red-600";
    alertMode = true;
  } else if (timeLeft.total <= 600) {
    // Less than 10 minutes
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    iconClass = "text-amber-600";
  }

  const formatTime = (time: number) => (time < 10 ? `0${time}` : time);

  if (timeLeft.total === 999) return <Badge variant="outline" className="py-1 px-3 text-sm">Loading timer...</Badge>;

  return (
    <Badge variant="outline" className={`py-1.5 px-3 text-sm font-mono tracking-widest flex items-center gap-2 border ${colorClass}`}>
      {alertMode ? <AlertTriangle className={`h-4 w-4 ${iconClass}`} /> : <Clock className={`h-4 w-4 ${iconClass}`} />}
      {formatTime(timeLeft.m)}:{formatTime(timeLeft.s)}
    </Badge>
  );
}