'use client';

import { useNavigation } from '../context/NavigationContext';
import Navigation from './Navigation';

export default function NavigationWrapper() {
  const { discomFilter, onDiscomChange, onExportClick } = useNavigation();
  
  return (
    <Navigation 
      discomFilter={discomFilter}
      onDiscomChange={onDiscomChange}
      onExportClick={onExportClick}
    />
  );
}
