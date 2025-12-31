import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { CreateProjectButton } from "@/components/create-project-button"
import { ProjectCard } from "@/components/project-card"
import type { ProjectWithYarns } from "@/lib/types"
import { calculateYarnDemands } from "@/lib/yarn-utils"

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_yarns (
        *,
        yarns (*)
      )
    `,
    )
    .order("created_at", { ascending: false })

  const yarnDemands = projects ? calculateYarnDemands(projects) : new Map()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-muted-foreground">Track your knitting and crochet projects</p>
          </div>
          <CreateProjectButton />
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: ProjectWithYarns) => (
              <ProjectCard key={project.id} project={project} yarnDemands={yarnDemands} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">No projects yet</p>
            <p className="text-sm text-muted-foreground">Create your first project to get started</p>
          </div>
        )}
      </main>
    </div>
  )
}
