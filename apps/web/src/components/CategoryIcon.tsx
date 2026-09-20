import React from 'react';
import {
  Flame,
  Waves,
  HeartPulse,
  Car,
  Building2,
  Zap,
  ShieldAlert,
  UserCheck,
  Biohazard,
  AlertTriangle,
} from 'lucide-react';
import { IncidentCategory } from '@resqgrid/types';

interface CategoryIconProps {
  category: IncidentCategory | string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = '', size = 18 }) => {
  const cat = String(category).toUpperCase();

  switch (cat) {
    case 'FIRE':
      return <Flame size={size} className={`text-orange-500 ${className}`} />;
    case 'FLOOD':
      return <Waves size={size} className={`text-blue-400 ${className}`} />;
    case 'MEDICAL':
      return <HeartPulse size={size} className={`text-red-400 ${className}`} />;
    case 'ACCIDENT':
      return <Car size={size} className={`text-amber-400 ${className}`} />;
    case 'STRUCTURAL':
      return <Building2 size={size} className={`text-stone-400 ${className}`} />;
    case 'ELECTRICAL':
      return <Zap size={size} className={`text-yellow-400 ${className}`} />;
    case 'SECURITY':
      return <ShieldAlert size={size} className={`text-indigo-400 ${className}`} />;
    case 'MISSING_PERSON':
      return <UserCheck size={size} className={`text-purple-400 ${className}`} />;
    case 'HAZMAT':
      return <Biohazard size={size} className={`text-lime-400 ${className}`} />;
    default:
      return <AlertTriangle size={size} className={`text-slate-400 ${className}`} />;
  }
};
