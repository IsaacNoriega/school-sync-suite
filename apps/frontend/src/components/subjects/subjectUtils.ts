import {
  BookOpen,
  DraftingCompass,
  FlaskConical,
  Palette,
  Music,
  Trophy,
  ClipboardList,
  FileText,
  LucideIcon,
} from 'lucide-react';

export interface SubjectItem {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  iconKey?: string;
  grade?: string;
  activeTasksCount?: number;
}

export interface AssignmentItem {
  _id: string;
  title: string;
  code?: string;
  description?: string;
  dueDate?: string;
  maxScore: number;
  color?: string;
  iconKey?: string;
  deliveredCount?: number;
  totalStudents?: number;
  status?: 'active' | 'completed' | 'pending';
  subject: {
    _id: string;
    name: string;
    code?: string;
    color?: string;
    iconKey?: string;
  } | string;
}

export const LUCIDE_ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  math: DraftingCompass,
  science: FlaskConical,
  art: Palette,
  music: Music,
  sport: Trophy,
  clipboard: ClipboardList,
  exam: FileText,
};

export const COLOR_MAP: Record<
  string,
  {
    cardBg: string;
    badgeBg: string;
    badgeText: string;
    textColor: string;
    iconBg: string;
    borderHover: string;
  }
> = {
  sky: {
    cardBg: 'bg-[#e0f1fc]',
    badgeBg: 'bg-[#c5e4fa]',
    badgeText: 'text-sky-800',
    textColor: 'text-sky-900',
    iconBg: 'bg-sky-100 text-sky-700',
    borderHover: 'hover:border-sky-300',
  },
  emerald: {
    cardBg: 'bg-[#ddfae6]',
    badgeBg: 'bg-[#bbf7d0]',
    badgeText: 'text-emerald-800',
    textColor: 'text-emerald-900',
    iconBg: 'bg-emerald-100 text-emerald-700',
    borderHover: 'hover:border-emerald-300',
  },
  amber: {
    cardBg: 'bg-[#fef8c3]',
    badgeBg: 'bg-[#fef08a]',
    badgeText: 'text-amber-900',
    textColor: 'text-amber-950',
    iconBg: 'bg-amber-100 text-amber-700',
    borderHover: 'hover:border-amber-300',
  },
  rose: {
    cardBg: 'bg-[#ffe4e6]',
    badgeBg: 'bg-[#fecdd3]',
    badgeText: 'text-rose-800',
    textColor: 'text-rose-950',
    iconBg: 'bg-rose-100 text-rose-700',
    borderHover: 'hover:border-rose-300',
  },
  purple: {
    cardBg: 'bg-[#f3e8ff]',
    badgeBg: 'bg-[#e9d5ff]',
    badgeText: 'text-purple-800',
    textColor: 'text-purple-950',
    iconBg: 'bg-purple-100 text-purple-700',
    borderHover: 'hover:border-purple-300',
  },
};

export const DEFAULT_THEME_KEYS = ['sky', 'emerald', 'amber', 'rose', 'purple'];

export function getSubjectVisuals(
  sub: { name: string; code?: string; color?: string; iconKey?: string },
  index: number = 0
) {
  const colorKey =
    sub.color && COLOR_MAP[sub.color]
      ? sub.color
      : DEFAULT_THEME_KEYS[index % DEFAULT_THEME_KEYS.length];
  const theme = COLOR_MAP[colorKey] || COLOR_MAP.sky;

  let IconComponent =
    sub.iconKey && LUCIDE_ICONS[sub.iconKey] ? LUCIDE_ICONS[sub.iconKey] : null;

  if (!IconComponent) {
    const nameLower = (sub.name || '').toLowerCase();
    if (nameLower.includes('mat')) {
      IconComponent = DraftingCompass;
    } else if (
      nameLower.includes('español') ||
      nameLower.includes('lectura') ||
      nameLower.includes('lengua')
    ) {
      IconComponent = BookOpen;
    } else if (
      nameLower.includes('cien') ||
      nameLower.includes('bio') ||
      nameLower.includes('quim')
    ) {
      IconComponent = FlaskConical;
    } else if (
      nameLower.includes('art') ||
      nameLower.includes('hist') ||
      nameLower.includes('soc')
    ) {
      IconComponent = Palette;
    } else if (nameLower.includes('músic') || nameLower.includes('music')) {
      IconComponent = Music;
    } else if (nameLower.includes('depor') || nameLower.includes('físic')) {
      IconComponent = Trophy;
    } else {
      IconComponent = BookOpen;
    }
  }

  return {
    ...theme,
    IconComponent,
    colorKey,
  };
}

export function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || '';
  }
  return '';
}
