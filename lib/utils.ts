import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs > 0 ? `${secs}s` : ''}`;
  }
  return `${secs}s`;
}

export function formatViews(num: number): string {
  if (!num || isNaN(num)) return "0";
  return Number(num).toLocaleString('en-IN');
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  const numericAmount = Number(amount) || 0;
  return `₹${numericAmount.toLocaleString('en-IN')}`;
}

export function formatDate(dateString: string, locale: string = "en-US"): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string, locale: string = "en-US"): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function formatActiveHours(
  loginTime?: string,
  lang: string = 'mr'
): { text: string; hours: number; minutes: number; isRecent: boolean } {
  if (!loginTime) {
    return {
      text: lang === 'mr' ? 'सक्रिय' : lang === 'hi' ? 'सक्रिय' : 'Active',
      hours: 0,
      minutes: 0,
      isRecent: false,
    };
  }

  const loginDate = new Date(loginTime);
  const diffMs = Math.max(0, Date.now() - loginDate.getTime());
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  const days = Math.floor(hours / 24);

  let text = '';
  if (lang === 'mr') {
    if (totalMins < 2) text = 'आत्ताच सक्रिय (Just now)';
    else if (hours === 0) text = `${minutes} मिनिटे सक्रिय`;
    else if (days === 0) text = `${hours} तास ${minutes > 0 ? `${minutes} मि.` : ''} सक्रिय`;
    else text = `${days} दिवस ${hours % 24} तास सक्रिय`;
  } else if (lang === 'hi') {
    if (totalMins < 2) text = 'अभी सक्रिय (Just now)';
    else if (hours === 0) text = `${minutes} मिनट सक्रिय`;
    else if (days === 0) text = `${hours} घंटे ${minutes > 0 ? `${minutes} मि.` : ''} सक्रिय`;
    else text = `${days} दिन ${hours % 24} घंटे सक्रिय`;
  } else {
    if (totalMins < 2) text = 'Active just now';
    else if (hours === 0) text = `${minutes} mins active`;
    else if (days === 0) text = `${hours}h ${minutes > 0 ? `${minutes}m` : ''} active`;
    else text = `${days}d ${hours % 24}h active`;
  }

  return { text, hours, minutes, isRecent: totalMins < 2 };
}
