import { CreateProjectButton } from '@/components/create-project-button';
import { Navbar } from '@/components/navbar';
import { ProjectsGrid } from '@/components/projects-grid';
import { createClient } from '@/lib/supabase/server';

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_yarns (
        *,
        yarns (*)
      ),
      images:project_images(*)
    `,
    )
    .order('created_at', { ascending: false });

  const { data: yarns } = await supabase
    .from('yarns')
    .select('*')
    .order('name', { ascending: true });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-muted-foreground">
              Track your knitting and crochet projects
            </p>
          </div>
          <CreateProjectButton />
        </div>

        <ProjectsGrid projects={projects || []} allYarns={yarns || []} />
      </main>
    </div>
  );
}
