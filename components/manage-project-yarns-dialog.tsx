"use client"

import { useState } from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { ProjectWithYarns, Yarn } from "@/lib/types"

interface ManageProjectYarnsDialogProps {
  project: ProjectWithYarns
  open: boolean
  onOpenChange: (open: boolean) => void
  allYarns: Yarn[]
}

export function ManageProjectYarnsDialog({
  project,
  open,
  onOpenChange,
  allYarns,
}: ManageProjectYarnsDialogProps) {
  const [selectedYarnId, setSelectedYarnId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAddYarn = async () => {
    if (!selectedYarnId) return

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("project_yarns").insert({
      project_id: project.id,
      yarn_id: selectedYarnId,
      quantity_needed: Number.parseInt(quantity) || 1,
    })

    setIsLoading(false)

    if (!error) {
      setSelectedYarnId("")
      setQuantity("1")
      router.refresh()
    }
  }

  const handleRemoveYarn = async (projectYarnId: string) => {
    const supabase = createClient()
    await supabase.from("project_yarns").delete().eq("id", projectYarnId)
    router.refresh()
  }

  const availableYarns = allYarns.filter(
    (yarn) => !project.project_yarns.some((py) => py.yarn_id === yarn.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Project Yarns</DialogTitle>
          <DialogDescription>Add or remove yarns for {project.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Yarns */}
          {project.project_yarns.length > 0 && (
            <div className="space-y-2">
              <Label>Current Yarns</Label>
              <div className="space-y-2">
                {project.project_yarns.map((py) => (
                  <div
                    key={py.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {py.yarns.name} - {py.yarns.color}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Quantity: {py.quantity_needed}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveYarn(py.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Yarn */}
          <div className="space-y-3">
            <Label>Add Yarn</Label>
            <div className="space-y-2">
              <Select value={selectedYarnId} onValueChange={setSelectedYarnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a yarn" />
                </SelectTrigger>
                <SelectContent>
                  {availableYarns.length > 0 ? (
                    availableYarns.map((yarn) => (
                      <SelectItem key={yarn.id} value={yarn.id}>
                        {yarn.name} - {yarn.color}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No yarns available
                    </div>
                  )}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                  />
                </div>
                <Button onClick={handleAddYarn} disabled={!selectedYarnId || isLoading}>
                  {isLoading ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
