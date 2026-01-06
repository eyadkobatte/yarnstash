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
  X,
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

function DisplayImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const supabase = createClient()
  const { data } = supabase.storage.from("project-images").getPublicUrl(path)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={data.publicUrl} alt={alt} className={className || "h-full w-full object-cover"} />
  )
}

export function ProjectCard({ project, yarnDemands, allYarns }: ProjectCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [manageYarnsOpen, setManageYarnsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
  })
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files))
    }
  }

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index))
  }

  const handleDeleteImage = async (imageId: string, storagePath: string) => {
    if (!confirm("Delete this image?")) return

    setIsLoading(true)
    const supabase = createClient()

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("project-images")
      .remove([storagePath])

    if (storageError) {
      console.error("Error deleting image from storage:", storageError)
    }

    // Delete from db
    const { error: dbError } = await supabase
      .from("project_images")
      .delete()
      .eq("id", imageId)

    if (dbError) {
      console.error("Error deleting image link:", dbError)
    }

    setIsLoading(false)
    router.refresh()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        setIsLoading(false)
        return
    }

    const { error } = await supabase
      .from("projects")
      .update({
        name: formData.name,
        description: formData.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id)

    // Upload newly selected images
    if (newFiles.length > 0) {
      for (const file of newFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(fileName, file)

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
          continue
        }

        await supabase.from("project_images").insert({
          project_id: project.id,
          storage_path: fileName,
        })
      }
    }

    setIsLoading(false)

    if (!error) {
      setEditOpen(false)
      setNewFiles([])
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
    return py.yarns.is_active && py.yarns.skein_count >= py.quantity_needed
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
          {project.images && project.images.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {project.images.map((img) => (
                <div key={img.id} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border text-center">
                    <DisplayImage path={img.storage_path} alt={project.name} />
                </div>
              ))}
            </div>
          )}
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
                    const hasEnough = py.yarns.is_active && py.yarns.skein_count >= py.quantity_needed

                    return (
                      <div key={py.id} className="space-y-1">
                        <div className="flex items-start justify-between gap-2 text-sm">
                          <div className="flex-1">
                            <span className="font-medium">{py.yarns.name}</span>
                            <span className="text-muted-foreground"> - {py.yarns.colorway}</span>
                          </div>
                          <Badge
                            variant={
                              yarnHasConflict ? "destructive" : hasEnough ? "default" : "secondary"
                            }
                          >
                            {py.yarns.skein_count}/{py.quantity_needed}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-2">
              <Label>Images</Label>
              {project.images && project.images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {project.images.map((img) => (
                    <div key={img.id} className="relative h-16 w-16 border rounded overflow-hidden group">
                      <DisplayImage path={img.storage_path} alt="Project" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id, img.storage_path)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {newFiles.length > 0 && (
                <div className="space-y-1 mt-2">
                   {newFiles.map((file, idx) => (
                     <div key={idx} className="flex items-center justify-between text-xs p-1 border rounded">
                       <span className="truncate max-w-[150px]">{file.name}</span>
                       <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={() => removeNewFile(idx)}>
                         <X className="h-3 w-3" />
                       </Button>
                     </div>
                   ))}
                </div>
              )}
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
