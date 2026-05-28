"use client";

import { useEffect, useState } from "react";
import { CheckIcon, LoaderIcon } from "lucide-react";

export interface Step {
  label: string;
  delayMs: number; // when to mark this step as active, relative to start
}

interface Props {
  steps: Step[];
  active: boolean; // true while the operation is running
}

export function StepProgress({ steps, active }: Props) {
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (!active) { setCurrentStep(-1); return; }
    setCurrentStep(0);
    const timers = steps.slice(1).map((step, i) =>
      setTimeout(() => setCurrentStep(i + 1), step.delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <div className="rounded-md border bg-zinc-50 px-4 py-3 space-y-2">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const running = i === currentStep;
        return (
          <div key={i} className={`flex items-center gap-2.5 text-sm transition-opacity duration-300 ${i > currentStep ? "opacity-30" : "opacity-100"}`}>
            <span className="shrink-0 w-4 h-4 flex items-center justify-center">
              {done ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : running ? (
                <LoaderIcon className="h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 mx-auto" />
              )}
            </span>
            <span className={running ? "text-zinc-900 font-medium" : done ? "text-zinc-500" : "text-zinc-400"}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
