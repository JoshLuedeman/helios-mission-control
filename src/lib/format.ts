export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatCronExpression(expr: string): string {
  // Simple human-readable cron descriptions
  const parts = expr.split(" ");
  if (parts.length !== 5) return expr;

  const [min, hour, day, month, _dow] = parts;

  if (min.startsWith("*/")) {
    return `every ${min.slice(2)} min (${hour === "*" ? "all day" : `${hour}`})`;
  }
  if (day !== "*" && month !== "*") {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[parseInt(month)] || month} ${day} at ${hour}:${min.padStart(2, "0")}`;
  }
  if (hour !== "*" && min !== "*") {
    return `daily at ${hour}:${min.padStart(2, "0")}`;
  }
  return expr;
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}
