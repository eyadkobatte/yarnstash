"use client"

import type React from "react"

import { useState } from "react"
import { Plus } from "lucide-react"
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
  const [formData, setFormData] = useState({
    name: "",
    color: "",
    count: "",
    color_number: "",
    lot_number: "",
    notes: "",
  })
  const router = useRouter()

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

    const { error } = await supabase.from("yarns").insert({
      name: formData.name,
      color: formData.color,
      count: Number.parseInt(formData.count) || 0,
      color_number: formData.color_number || null,
      lot_number: formData.lot_number || null,
      notes: formData.notes || null,
      is_active: Number.parseInt(formData.count) > 0,
      user_id: user.id,
    })

    setIsLoading(false)

    if (!error) {
      setFormData({
        name: "",
        color: "",
        count: "",
        color_number: "",
        lot_number: "",
        notes: "",
      })
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Yarn</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Yarn"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
