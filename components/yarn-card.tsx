"use client"

import type React from "react"

import { useState } from "react"
import { AlertTriangle, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
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

export function YarnCard({ yarn, demand }: YarnCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [addStockOpen, setAddStockOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stockToAdd, setStockToAdd] = useState("")
  const [formData, setFormData] = useState({
    name: yarn.name,
    color: yarn.color,
    count: yarn.count.toString(),
    color_number: yarn.color_number || "",
    lot_number: yarn.lot_number || "",
    notes: yarn.notes || "",
  })
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const newCount = Number.parseInt(formData.count) || 0

    const { error } = await supabase
      .from("yarns")
      .update({
        name: formData.name,
        color: formData.color,
        count: newCount,
        color_number: formData.color_number || null,
        lot_number: formData.lot_number || null,
        notes: formData.notes || null,
        is_active: newCount > 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", yarn.id)

    setIsLoading(false)

    if (!error) {
      setEditOpen(false)
      router.refresh()
    }
  }

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const amountToAdd = Number.parseInt(stockToAdd) || 0
    const newCount = yarn.count + amountToAdd

    const { error } = await supabase
      .from("yarns")
      .update({
        count: newCount,
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
              <p className="text-sm text-muted-foreground">{yarn.color}</p>
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
                {yarn.count} {yarn.count === 1 ? "skein" : "skeins"}
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

            {yarn.color_number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Color Number:</span>
                <span className="text-sm font-medium">{yarn.color_number}</span>
              </div>
            )}

            {yarn.lot_number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lot Number:</span>
                <span className="text-sm font-medium">{yarn.lot_number}</span>
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
        <DialogContent className="max-w-md">
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
              <Label htmlFor="edit-color">Color *</Label>
              <Input
                id="edit-color"
                required
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
              <Label htmlFor="edit-color-number">Color Number</Label>
              <Input
                id="edit-color-number"
                value={formData.color_number}
                onChange={(e) => setFormData({ ...formData, color_number: e.target.value })}
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
              Add more stock for {yarn.name} - {yarn.color}
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
                <span className="font-medium">{yarn.count}</span>
              </div>
              {stockToAdd && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">New Total:</span>
                  <span className="font-medium">
                    {yarn.count + (Number.parseInt(stockToAdd) || 0)}
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
