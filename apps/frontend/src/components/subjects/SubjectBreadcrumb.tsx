'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Layers } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
  code?: string;
  color?: string;
}

export interface SubjectBreadcrumbProps {
  items?: BreadcrumbItem[];
  subjectName?: string;
  subjectCode?: string;
  basePath?: string;
  className?: string;
}

export const SubjectBreadcrumb: React.FC<SubjectBreadcrumbProps> = ({
  items,
  subjectName,
  subjectCode,
  basePath = '/subjects',
  className,
}) => {
  const breadcrumbItems: BreadcrumbItem[] = items || [
    {
      label: 'Materias',
      href: basePath,
    },
    ...(subjectName
      ? [
          {
            label: subjectName,
            active: true,
            code: subjectCode,
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center gap-2 text-xs font-bold text-slate-500 py-2.5 px-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-2xs w-fit max-w-full overflow-x-auto',
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
        <Layers className="w-3.5 h-3.5" />
      </div>

      {breadcrumbItems.map((item, idx) => {
        const isLast = idx === breadcrumbItems.length - 1 || item.active;

        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}

            {isLast || !item.href ? (
              <div className="flex items-center gap-1.5 font-black text-slate-900 truncate">
                <span className="truncate">{item.label}</span>
                {item.code && (
                  <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60 shrink-0">
                    {item.code}
                  </span>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className="text-slate-500 hover:text-sky-600 transition-colors font-extrabold truncate cursor-pointer hover:underline underline-offset-2"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default SubjectBreadcrumb;
