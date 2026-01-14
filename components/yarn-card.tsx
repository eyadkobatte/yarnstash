"use client"

import type React from "react"

import { useState } from "react"
import { AlertTriangle, MoreVertical, Pencil, Plus, Trash2, X, Image as ImageIcon } from "lucide-react"
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
import type { Yarn } from "@/lib/types"
import type { YarnDemand } from "@/lib/yarn-utils"

interface YarnCardProps {
  yarn: Yarn
  demand?: YarnDemand
}

function DisplayImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const supabase = createClient()
  const { data } = supabase.storage.from("yarn-images").getPublicUrl(path)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={data.publicUrl} alt={alt} className={className || "h-full w-full object-cover"} />
  )
}

export function YarnCard({ yarn, demand }: YarnCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [addStockOpen, setAddStockOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stockToAdd, setStockToAdd] = useState("")
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    name: yarn.name,
    colorway: yarn.colorway,
    count: yarn.skein_count.toString(),
    lot_number: yarn.lot_number || "",
    notes: yarn.notes || "",
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
      .from("yarn-images")
      .remove([storagePath])
      
    if (storageError) {
      console.error("Error deleting image from storage:", storageError)
    }

    // Delete from db
    const { error: dbError } = await supabase
      .from("yarn_images")
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

    const newCount = Number.parseInt(formData.count) || 0

    const { error } = await supabase
      .from("yarns")
      .update({
        name: formData.name,
        colorway: formData.colorway,
        skein_count: newCount,
        lot_number: formData.lot_number || null,
        notes: formData.notes || null,
        is_active: newCount > 0,
        updated_at: new Date().toISOString(),
        ravelry_id: yarn.ravelry_id, // Preserve ravelry_id
      })
      .eq("id", yarn.id)

    setIsLoading(false)

    // Upload newly selected images
    if (newFiles.length > 0) {
      for (const file of newFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("yarn-images")
          .upload(fileName, file)

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
          continue
        }

        await supabase.from("yarn_images").insert({
          yarn_id: yarn.id,
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

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const amountToAdd = Number.parseInt(stockToAdd) || 0
    const newCount = yarn.skein_count + amountToAdd

    const { error } = await supabase
      .from("yarns")
      .update({
        skein_count: newCount,
        is_active: newCount > 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", yarn.id)

    setIsLoading(false)

    if (!error) {
      setStockToAdd("")
      setAddStockOpen(false)
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this yarn?")) return

    const supabase = createClient()
    await supabase.from("yarns").delete().eq("id", yarn.id)
    router.refresh()
  }

  return (
    <>
      <Card className={!yarn.is_active ? "opacity-60" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{yarn.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{yarn.colorway}</p>
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
                <DropdownMenuItem onClick={() => setAddStockOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stock
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
          {yarn.images && yarn.images.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {yarn.images.map((img) => (
                <div key={img.id} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border text-center">
                    <DisplayImage path={img.storage_path} alt={yarn.name} />
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {demand && demand.hasConflict && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs font-medium text-destructive">
                  {demand.totalDemand} needed, only {demand.availableCount} available
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In Stock:</span>
              <Badge variant={yarn.is_active ? "default" : "secondary"}>
                {yarn.skein_count} {yarn.skein_count === 1 ? "skein" : "skeins"}
              </Badge>
            </div>

            {demand && demand.projectDemands.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1">Used in projects:</p>
                {demand.projectDemands.map((pd) => (
                  <div key={pd.projectId} className="flex items-center justify-between text-xs">
                    <span>{pd.projectName}</span>
                    <span className="text-muted-foreground">{pd.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {yarn.lot_number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lot Number:</span>
                <span className="text-sm font-medium">{yarn.lot_number}</span>
              </div>
            )}

            {yarn.ravelry_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ravelry ID:</span>
                <span className="text-sm font-medium text-muted-foreground">#{yarn.ravelry_id}</span>
              </div>
            )}

            {yarn.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{yarn.notes}</p>
              </div>
            )}

            {!yarn.is_active && (
              <Badge variant="outline" className="w-full justify-center">
                Out of Stock
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Yarn</DialogTitle>
            <DialogDescription>Update yarn information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-colorway">Colorway *</Label>
              <Input
                id="edit-colorway"
                required
                value={formData.colorway}
                onChange={(e) => setFormData({ ...formData, colorway: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-count">Count *</Label>
              <Input
                id="edit-count"
                type="number"
                required
                min="0"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lot-number">Lot Number</Label>
              <Input
                id="edit-lot-number"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              {yarn.images && yarn.images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {yarn.images.map((img) => (
                    <div key={img.id} className="relative h-16 w-16 border rounded overflow-hidden group">
                      <DisplayImage path={img.storage_path} alt="Yarn" className="object-cover w-full h-full" />
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
              {isLoading ? "Updating..." : "Update Yarn"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Add more stock for {yarn.name} - {yarn.colorway}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-amount">Amount to Add *</Label>
              <Input
                id="stock-amount"
                type="number"
                required
                min="1"
                value={stockToAdd}
                onChange={(e) => setStockToAdd(e.target.value)}
                placeholder="Number of skeins to add"
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium">{yarn.skein_count}</span>
              </div>
              {stockToAdd && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">New Total:</span>
                  <span className="font-medium">
                    {yarn.skein_count + (Number.parseInt(stockToAdd) || 0)}
                  </span>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Stock"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
