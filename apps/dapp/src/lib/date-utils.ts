export function formatDate(timestampMs: number) {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function calculateRemainingTime(timestampMs: number) {
  const diff = timestampMs - Date.now();
  if (diff <= 0) {
    return null;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

export function formatRemainingTime(timestampMs: number, language: "en" | "zh") {
  const remaining = calculateRemainingTime(timestampMs);
  if (!remaining) {
    return language === "zh" ? "已过期" : "Expired";
  }

  if (language === "zh") {
    if (remaining.days > 0) return `${remaining.days}天 ${remaining.hours}小时`;
    if (remaining.hours > 0) return `${remaining.hours}小时 ${remaining.minutes}分钟`;
    return `${remaining.minutes}分钟`;
  }

  if (remaining.days > 0) return `${remaining.days}d ${remaining.hours}h`;
  if (remaining.hours > 0) return `${remaining.hours}h ${remaining.minutes}m`;
  return `${remaining.minutes}m`;
}
