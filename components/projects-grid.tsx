'use client';

import { useMemo } from 'react';

import { ProjectCard } from '@/components/project-card';
import type { ProjectWithYarns, Yarn } from '@/lib/types';
import { calculateYarnDemands } from '@/lib/yarn-utils';

interface ProjectsGridProps {
  projects: ProjectWithYarns[];
  allYarns: Yarn[];
}

export function ProjectsGrid({ projects, allYarns }: ProjectsGridProps) {
  const yarnDemands = useMemo(() => calculateYarnDemands(projects), [projects]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground mb-4">No projects yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          yarnDemands={yarnDemands}
          allYarns={allYarns}
        />
      ))}
    </div>
  );
}
