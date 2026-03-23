import { DetailFieldProps } from "./TaskCard";

export function DetailField({ label, value, valueClassName }: DetailFieldProps) {
    return (
        <div className="grid gap-2 border border-white/7 bg-white/3 px-4 py-3.5">
            <div className="text-[10px] font-light uppercase tracking-[0.22em] text-white/38">{label}</div>
            <div className={`font-mono tracking-[0.05em] text-white ${valueClassName ?? "text-[15px] leading-6"}`}>{value}</div>
        </div>
    );
}
