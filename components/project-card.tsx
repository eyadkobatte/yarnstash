"use client"

import type React from "react"

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { ProjectWithYarns, Yarn } from "@/lib/types"
import { ManageProjectYarnsDialog } from "@/components/manage-project-yarns-dialog"
import { getProjectConflicts, type YarnDemand } from "@/lib/yarn-utils"

interface ProjectCardProps {
  project: ProjectWithYarns
  yarnDemands: Map<string, YarnDemand>
  allYarns: Yarn[]
}

export function ProjectCard({ project, yarnDemands, allYarns }: ProjectCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [manageYarnsOpen, setManageYarnsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
  })
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    const { error } = await supabase
      .from("projects")
      .update({
        name: formData.name,
        description: formData.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id)

    setIsLoading(false)

    if (!error) {
      setEditOpen(false)
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return

    const supabase = createClient()
    await supabase.from("projects").delete().eq("id", project.id)
    router.refresh()
  }

  const conflicts = getProjectConflicts(project, yarnDemands)
  const hasConflicts = conflicts.length > 0

  const allYarnsInStock = project.project_yarns.every((py) => {
    const demand = yarnDemands.get(py.yarn_id)
    if (demand && demand.hasConflict) {
      return false
    }
    return py.yarns.is_active && py.yarns.count >= py.quantity_needed
  })

  const hasYarns = project.project_yarns.length > 0

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setManageYarnsOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Yarns
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hasYarns ? (
              <>
                {hasConflicts ? (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
                      Yarn conflict detected
                    </span>
                  </div>
                ) : allYarnsInStock ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">All yarns in stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Circle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Missing yarn</span>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Required Yarns:</p>
                  {project.project_yarns.map((py) => {
                    const demand = yarnDemands.get(py.yarn_id)
                    const yarnHasConflict = demand && demand.hasConflict
                    const hasEnough = py.yarns.is_active && py.yarns.count >= py.quantity_needed

                    return (
                      <div key={py.id} className="space-y-1">
                        <div className="flex items-start justify-between gap-2 text-sm">
                          <div className="flex-1">
                            <span className="font-medium">{py.yarns.name}</span>
                            <span className="text-muted-foreground"> - {py.yarns.color}</span>
                          </div>
                          <Badge
                            variant={
                              yarnHasConflict ? "destructive" : hasEnough ? "default" : "secondary"
                            }
                          >
                            {py.yarns.count}/{py.quantity_needed}
                          </Badge>
                        </div>
                        {yarnHasConflict && demand && (
                          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                            <p className="font-medium">
                              Total demand: {demand.totalDemand} (Available: {demand.availableCount}
                              )
                            </p>
                            {demand.projectDemands
                              .filter((p) => p.projectId !== project.id)
                              .map((p) => (
                                <p key={p.projectId} className="text-muted-foreground">
                                  • {p.projectName} needs {p.quantity}
                                </p>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No yarns added yet</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setManageYarnsOpen(true)}
                  className="mt-2"
                >
                  Add yarns to project
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Project Name *</Label>
              <Input
                id="edit-project-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-project-description">Description</Label>
              <Textarea
                id="edit-project-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Project"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Yarns Dialog */}
      <ManageProjectYarnsDialog
        project={project}
        open={manageYarnsOpen}
        onOpenChange={setManageYarnsOpen}
        allYarns={allYarns}
      />
    </>
  )
}
