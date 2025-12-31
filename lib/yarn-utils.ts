import type { ProjectWithYarns, Yarn } from "./types"

export interface YarnDemand {
  yarnId: string
  yarn: Yarn
  totalDemand: number
  projectDemands: {
    projectId: string
    projectName: string
    quantity: number
  }[]
  hasConflict: boolean
  availableCount: number
}

export function calculateYarnDemands(projects: ProjectWithYarns[]): Map<string, YarnDemand> {
  const demandMap = new Map<string, YarnDemand>()

  // Calculate demand for each yarn across all projects
  for (const project of projects) {
    for (const projectYarn of project.project_yarns) {
      const yarnId = projectYarn.yarn_id
      const existing = demandMap.get(yarnId)

      if (existing) {
        existing.totalDemand += projectYarn.quantity_needed
        existing.projectDemands.push({
          projectId: project.id,
          projectName: project.name,
          quantity: projectYarn.quantity_needed,
        })
        existing.hasConflict = existing.totalDemand > existing.availableCount
      } else {
        const totalDemand = projectYarn.quantity_needed
        demandMap.set(yarnId, {
          yarnId,
          yarn: projectYarn.yarns,
          totalDemand,
          projectDemands: [
            {
              projectId: project.id,
              projectName: project.name,
              quantity: projectYarn.quantity_needed,
            },
          ],
          hasConflict: totalDemand > projectYarn.yarns.count,
          availableCount: projectYarn.yarns.count,
        })
      }
    }
  }

  return demandMap
}

export function getProjectConflicts(project: ProjectWithYarns, yarnDemands: Map<string, YarnDemand>) {
  const conflicts = []

  for (const projectYarn of project.project_yarns) {
    const demand = yarnDemands.get(projectYarn.yarn_id)
    if (demand && demand.hasConflict) {
      conflicts.push({
        yarn: projectYarn.yarns,
        needed: projectYarn.quantity_needed,
        available: demand.availableCount,
        totalDemand: demand.totalDemand,
        competingProjects: demand.projectDemands.filter((p) => p.projectId !== project.id),
      })
    }
  }

  return conflicts
}
