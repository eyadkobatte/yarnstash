"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function QuickAddYarnButton() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    name: "",
    color: "",
    count: "",
    color_number: "",
    lot_number: "",
    notes: "",
  })
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const { data: yarn, error } = await supabase
      .from("yarns")
      .insert({
        name: formData.name,
        color: formData.color,
        count: Number.parseInt(formData.count) || 0,
        color_number: formData.color_number || null,
        lot_number: formData.lot_number || null,
        notes: formData.notes || null,
        is_active: Number.parseInt(formData.count) > 0,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating yarn:", error)
      setIsLoading(false)
      return
    }

    // Upload images if any
    if (files.length > 0 && yarn) {
      for (const file of files) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("yarn-images")
          .upload(fileName, file)

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
          continue
        }

        const { error: imageError } = await supabase.from("yarn_images").insert({
          yarn_id: yarn.id,
          storage_path: fileName,
        })

        if (imageError) {
          console.error("Error linking image:", imageError)
        }
      }
    }

    setIsLoading(false)
    setFormData({
      name: "",
      color: "",
      count: "",
      color_number: "",
      lot_number: "",
      notes: "",
    })
    setFiles([])
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Yarn</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Yarn</DialogTitle>
          <DialogDescription>Add a new yarn to your inventory</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              type="text"
              autoComplete="off"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Merino Wool"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <Input
              id="color"
              required
              type="text"
              autoComplete="off"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="e.g., Deep Blue"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Count *</Label>
            <Input
              id="count"
              type="number"
              required
              min="0"
              value={formData.count}
              onChange={(e) => setFormData({ ...formData, count: e.target.value })}
              placeholder="Number of skeins"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color_number">Color Number</Label>
            <Input
              id="color_number"
              value={formData.color_number}
              onChange={(e) => setFormData({ ...formData, color_number: e.target.value })}
              placeholder="e.g., #1234"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot_number">Lot Number</Label>
            <Input
              id="lot_number"
              value={formData.lot_number}
              onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              placeholder="e.g., LOT456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Images</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 text-sm border rounded">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Yarn"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
