import { StatTileProps } from "./TaskCard";

export function StatTile({ label, value, footer, valueClassName }: StatTileProps) {
    return (
        <div className="grid gap-3 border border-white/7 bg-white/3 p-4">
            <div className="text-[10px] font-light uppercase tracking-[0.22em] text-white/38">{label}</div>
            <div className={`font-mono leading-none tracking-[0.04em] ${valueClassName ?? "text-[24px] text-white"}`}>{value}</div>
            {footer ? <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">{footer}</div> : null}
        </div>
    );
}
