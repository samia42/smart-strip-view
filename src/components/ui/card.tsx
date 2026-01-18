import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";



const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";


const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-green-500" : "bg-slate-700"
    )}
  >
    <span
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
);

const LightningIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export default function SmartDeviceCard() {
  const [isOn, setIsOn] = useState(true);

  return (
    <div className="flex justify-center items-center min-h-[300px] bg-slate-900 p-10">

      <Card className="w-[350px] bg-slate-950 border-slate-800 text-slate-100 shadow-xl">

        {/* HEADER : Title + Slider */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium text-slate-100">
            Living Room TV
          </CardTitle>
          <Switch checked={isOn} onCheckedChange={setIsOn} />
        </CardHeader>

        {/* CONTENT : Consumption + State */}
        <CardContent>
          <div className="flex flex-col mt-4 space-y-1">

            {/* Power (Blue wehn ON, Grey when OFF) */}
            <div className="flex items-center gap-2">
              <LightningIcon
                className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  isOn ? "text-blue-500" : "text-slate-600"
                )}
              />
              <span className={cn(
                "text-5xl font-bold transition-colors duration-300",
                isOn ? "text-blue-500" : "text-slate-600"
              )}>
                {isOn ? "125W" : "0W"}
              </span>
            </div>

            {/* Text under consumption */}
            <p className="text-sm text-slate-400 font-medium pl-1">
              {isOn ? "Live consumption" : "Off"}
            </p>
          </div>
        </CardContent>

      </Card>
    </div>
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };