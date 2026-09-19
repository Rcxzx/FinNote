import React from 'react';

export interface CodeFileItem {
  id: string;
  name: string;
  type: 'sql' | 'gs' | 'html' | 'json' | 'ts';
  category: 'supabase' | 'migration' | 'gas' | 'deploy';
  iconName: string;
  description: string;
  content: string;
  lines: number;
  sizeKb: string;
  highlightBadge?: string;
}

export interface MigrationStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  timeEstimate: string;
  status: 'pending' | 'in-progress' | 'completed';
  tags: string[];
  instructions: string[];
  actionLabel?: string;
  actionTab?: 'roadmap' | 'sql' | 'migrator' | 'tester' | 'vercel' | 'gas';
}
