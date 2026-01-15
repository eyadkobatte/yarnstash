'use client';

import {
  AlertTriangle,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';

import { AuthenticatedImage } from '@/components/authenticated-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import type { Yarn } from '@/lib/types';
import type { YarnDemand } from '@/lib/yarn-utils';

interface YarnCardProps {
  yarn: Yarn;
  demand?: YarnDemand;
}

function DisplayImage({
  path,
  alt,
  className,
  width = 500,
  height = 500,
}: {
  path: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <AuthenticatedImage
      bucket="yarn-images"
      path={path}
      alt={alt}
      className={className || 'h-full w-full object-cover'}
      width={width}
      height={height}
    />
  );
}

export function YarnCard({ yarn, demand }: YarnCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stockToAdd, setStockToAdd] = useState('');
  const [displayUnit, setDisplayUnit] = useState<
    'grams' | 'meters' | 'yards' | 'skeins'
  >(yarn.total_grams ? 'grams' : 'skeins');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: yarn.name,
    colorway: yarn.colorway,
    total_grams: yarn.total_grams?.toString() || '',
    grams_per_skein: yarn.grams_per_skein?.toString() || '',
    meters_per_skein: yarn.meters_per_skein?.toString() || '',
    lot_number: yarn.lot_number || '',
    notes: yarn.notes || '',
  });
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files));
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (imageId: string, storagePath: string) => {
    if (!confirm('Delete this image?')) return;

    setIsLoading(true);
    const supabase = createClient();

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('yarn-images')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting image from storage:', storageError);
    }

    // Delete from db
    const { error: dbError } = await supabase
      .from('yarn_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      console.error('Error deleting image link:', dbError);
    }

    setIsLoading(false);
    router.refresh();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    const totalGrams = Number.parseInt(formData.total_grams) || 0;
    const gramsPerSkein = Number.parseInt(formData.grams_per_skein) || null;
    const metersPerSkein = Number.parseInt(formData.meters_per_skein) || null;
    const newCount = gramsPerSkein
      ? Math.round((totalGrams / gramsPerSkein) * 10) / 10
      : yarn.skein_count;

    const { error } = await supabase
      .from('yarns')
      .update({
        name: formData.name,
        colorway: formData.colorway,
        skein_count: Math.round(newCount),
        total_grams: totalGrams || null,
        grams_per_skein: gramsPerSkein,
        meters_per_skein: metersPerSkein,
        lot_number: formData.lot_number || null,
        notes: formData.notes || null,
        is_active: totalGrams > 0 || yarn.skein_count > 0,
        updated_at: new Date().toISOString(),
        ravelry_id: yarn.ravelry_id,
      })
      .eq('id', yarn.id);

    setIsLoading(false);

    // Upload newly selected images
    if (newFiles.length > 0) {
      for (const file of newFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('yarn-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        await supabase.from('yarn_images').insert({
          yarn_id: yarn.id,
          storage_path: fileName,
        });
      }
    }

    setIsLoading(false);

    if (!error) {
      setEditOpen(false);
      setNewFiles([]);
      router.refresh();
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const gramsToAdd = Number.parseInt(stockToAdd) || 0;
    const newTotalGrams = (yarn.total_grams || 0) + gramsToAdd;
    const newSkeinCount = yarn.grams_per_skein
      ? Math.round((newTotalGrams / yarn.grams_per_skein) * 10) / 10
      : yarn.skein_count;

    const { error } = await supabase
      .from('yarns')
      .update({
        total_grams: newTotalGrams,
        skein_count: Math.round(newSkeinCount),
        is_active: newTotalGrams > 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', yarn.id);

    setIsLoading(false);

    if (!error) {
      setStockToAdd('');
      setAddStockOpen(false);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this yarn?')) return;

    const supabase = createClient();
    await supabase.from('yarns').delete().eq('id', yarn.id);
    router.refresh();
  };

  return (
    <>
      <Card className={!yarn.is_active ? 'opacity-60' : ''}>
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
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
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
                <div
                  key={img.id}
                  className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border text-center"
                >
                  <DisplayImage
                    path={img.storage_path}
                    alt={yarn.name}
                    width={80}
                    height={80}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {demand && demand.hasConflict && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs font-medium text-destructive">
                  {demand.totalDemand} needed, only {demand.availableCount}{' '}
                  available
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In Stock:</span>
              <div className="flex items-center gap-1">
                <Badge
                  variant={yarn.is_active ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => {
                    const units: Array<
                      'grams' | 'meters' | 'yards' | 'skeins'
                    > = ['grams', 'meters', 'yards', 'skeins'];
                    const currentIdx = units.indexOf(displayUnit);
                    setDisplayUnit(units[(currentIdx + 1) % units.length]);
                  }}
                >
                  {displayUnit === 'grams' &&
                  yarn.total_grams !== null &&
                  yarn.total_grams !== undefined
                    ? `${yarn.total_grams}g`
                    : displayUnit === 'meters' &&
                        yarn.total_grams &&
                        yarn.grams_per_skein &&
                        yarn.meters_per_skein
                      ? `${Math.round((yarn.total_grams / yarn.grams_per_skein) * yarn.meters_per_skein)}m`
                      : displayUnit === 'yards' &&
                          yarn.total_grams &&
                          yarn.grams_per_skein &&
                          yarn.meters_per_skein
                        ? `${Math.round((yarn.total_grams / yarn.grams_per_skein) * yarn.meters_per_skein * 1.0936)}yd`
                        : `${yarn.skein_count} ${yarn.skein_count === 1 ? 'skein' : 'skeins'}`}
                </Badge>
              </div>
            </div>

            {demand && demand.projectDemands.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Used in projects:
                </p>
                {demand.projectDemands.map((pd) => (
                  <div
                    key={pd.projectId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span>{pd.projectName}</span>
                    <span className="text-muted-foreground">{pd.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {yarn.lot_number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Lot Number:
                </span>
                <span className="text-sm font-medium">{yarn.lot_number}</span>
              </div>
            )}

            {yarn.ravelry_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Ravelry ID:
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  #{yarn.ravelry_id}
                </span>
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
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-colorway">Colorway *</Label>
              <Input
                id="edit-colorway"
                required
                value={formData.colorway}
                onChange={(e) =>
                  setFormData({ ...formData, colorway: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-total_grams">Total Grams *</Label>
              <Input
                id="edit-total_grams"
                type="number"
                required
                min="0"
                value={formData.total_grams}
                onChange={(e) =>
                  setFormData({ ...formData, total_grams: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-grams_per_skein">Grams/Skein</Label>
                <Input
                  id="edit-grams_per_skein"
                  type="number"
                  min="1"
                  value={formData.grams_per_skein}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grams_per_skein: e.target.value,
                    })
                  }
                  placeholder="e.g., 100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-meters_per_skein">Meters/Skein</Label>
                <Input
                  id="edit-meters_per_skein"
                  type="number"
                  min="1"
                  value={formData.meters_per_skein}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meters_per_skein: e.target.value,
                    })
                  }
                  placeholder="e.g., 200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lot-number">Lot Number</Label>
              <Input
                id="edit-lot-number"
                value={formData.lot_number}
                onChange={(e) =>
                  setFormData({ ...formData, lot_number: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              {yarn.images && yarn.images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {yarn.images.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-16 w-16 border rounded overflow-hidden group"
                    >
                      <DisplayImage
                        path={img.storage_path}
                        alt="Yarn"
                        className="object-cover w-full h-full"
                        width={64}
                        height={64}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteImage(img.id, img.storage_path)
                        }
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
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-1 border rounded"
                    >
                      <span className="truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => removeNewFile(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Yarn'}
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
              <Label htmlFor="stock-amount">Grams to Add *</Label>
              <Input
                id="stock-amount"
                type="number"
                required
                min="1"
                value={stockToAdd}
                onChange={(e) => setStockToAdd(e.target.value)}
                placeholder="Grams to add"
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium">{yarn.total_grams || 0}g</span>
              </div>
              {stockToAdd && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">New Total:</span>
                  <span className="font-medium">
                    {(yarn.total_grams || 0) +
                      (Number.parseInt(stockToAdd) || 0)}
                    g
                  </span>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Stock'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
