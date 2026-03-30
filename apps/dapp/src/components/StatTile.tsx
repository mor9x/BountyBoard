import { StatTileProps } from "./TaskCard";

export function StatTile({ label, value, footer, footerTitle, valueClassName }: StatTileProps) {
  return (
    <div className="group relative flex h-full flex-col justify-between border border-white/10 bg-white/[0.02] px-10 py-8 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/20">
      <div className="absolute top-[-1px] left-0 h-[2px] w-0 bg-[#ff5a1f] transition-all duration-500 group-hover:w-full" />
      
      <div className="space-y-3">
        <div className="text-[13px] font-bold uppercase tracking-[0.4em] text-white/30">{label}</div>
        <div className={`font-mono leading-tight tracking-tight ${valueClassName ?? "text-3xl text-white"}`}>
          {value}
        </div>
      </div>

      {footer ? (
        <div className="mt-5 inline-flex self-start border border-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-white/25" title={footerTitle}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}
