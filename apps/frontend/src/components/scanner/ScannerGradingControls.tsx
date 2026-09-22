import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui';
import { SubjectOption, AssignmentOption } from './types';

interface ScannerGradingControlsProps {
  subjects: SubjectOption[];
  selectedSubjectId: string;
  onSubjectChange: (id: string) => void;
  assignments: AssignmentOption[];
  selectedAssignmentId: string;
  onAssignmentChange: (id: string) => void;
  gradingScore: number;
  onGradingScoreChange: (score: number) => void;
}

export const ScannerGradingControls: React.FC<ScannerGradingControlsProps> = ({
  subjects,
  selectedSubjectId,
  onSubjectChange,
  assignments,
  selectedAssignmentId,
  onAssignmentChange,
  gradingScore,
  onGradingScoreChange,
}) => {
  const activeAssignment = assignments.find((a) => a._id === selectedAssignmentId);
  const currentMaxScore = activeAssignment?.maxScore || 100;

  return (
    <div className="max-w-4xl mx-auto bg-[#e6f4fe] border border-sky-100/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Selector de Materia */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#0284c7] pl-1">Materia:</label>
          <div className="relative">
            <select
              value={selectedSubjectId}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-slate-800 appearance-none shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Selector de Tarea Activa */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#0284c7] pl-1">Tarea Activa:</label>
          <div className="relative">
            <select
              value={selectedAssignmentId}
              onChange={(e) => onAssignmentChange(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-slate-800 appearance-none shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {assignments.map((asg) => (
                <option key={asg._id} value={asg._id}>
                  {asg.title} {asg.maxScore ? `(${asg.maxScore} pts)` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Puntos a Asignar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between pl-1">
            <label className="text-xs font-bold text-[#0284c7]">Puntos a Asignar:</label>
            <span className="text-[10px] font-black text-sky-700 bg-sky-100/90 px-2 py-0.5 rounded-lg border border-sky-200/50">
              Máx: {currentMaxScore} pts
            </span>
          </div>
          <Input
            type="number"
            min={0}
            max={currentMaxScore}
            value={gradingScore}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (isNaN(val)) {
                onGradingScoreChange(0);
              } else {
                onGradingScoreChange(Math.min(currentMaxScore, Math.max(0, val)));
              }
            }}
            className="text-center font-black text-lg text-[#0284c7] bg-white border border-slate-200/80 rounded-2xl py-1 shadow-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default ScannerGradingControls;
