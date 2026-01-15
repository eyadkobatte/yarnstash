import { Navbar } from '@/components/navbar';
import { QuickAddYarnButton } from '@/components/quick-add-yarn-button';
import { YarnCard } from '@/components/yarn-card';
import { createClient } from '@/lib/supabase/server';
import type { Yarn } from '@/lib/types';
import { calculateYarnDemands } from '@/lib/yarn-utils';

export default async function YarnsPage() {
  const supabase = await createClient();

  const { data: yarns } = await supabase
    .from('yarns')
    .select('*, images:yarn_images(*)')
    .order('created_at', { ascending: false });

  const { data: projects } = await supabase.from('projects').select(
    `
      *,
      project_yarns (
        *,
        yarns (*)
      )
    `,
  );

  const yarnDemands = projects ? calculateYarnDemands(projects) : new Map();

  const activeYarns = yarns?.filter((yarn) => yarn.is_active) || [];
  const inactiveYarns = yarns?.filter((yarn) => !yarn.is_active) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Yarn Inventory</h1>
          <p className="text-muted-foreground">
            Manage your yarn collection and stock levels
          </p>
        </div>

        {yarns && yarns.length > 0 ? (
          <div className="space-y-8">
            {activeYarns.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">In Stock</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeYarns.map((yarn: Yarn) => (
                    <YarnCard
                      key={yarn.id}
                      yarn={yarn}
                      demand={yarnDemands.get(yarn.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {inactiveYarns.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Out of Stock</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inactiveYarns.map((yarn: Yarn) => (
                    <YarnCard
                      key={yarn.id}
                      yarn={yarn}
                      demand={yarnDemands.get(yarn.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              No yarns in your inventory yet
            </p>
            <p className="text-sm text-muted-foreground">
              Click the + button to add your first yarn
            </p>
          </div>
        )}
      </main>
      <QuickAddYarnButton />
    </div>
  );
}
