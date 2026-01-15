'use client';

import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

import {
  ColorwayAutocomplete,
  type RavelryColorway,
} from './colorway-autocomplete';
import { YarnAutocomplete, type RavelryYarn } from './yarn-autocomplete';

export function QuickAddYarnButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    colorway: '',
    total_grams: '',
    skeins: '', // Added for UI helper
    grams_per_skein: '',
    meters_per_skein: '',
    lot_number: '',
    notes: '',
    ravelry_id: null as number | null,
    colorway_id: '' as string,
  });
  const [colorways, setColorways] = useState<RavelryColorway[]>([]);
  const [isFetchingColorways, setIsFetchingColorways] = useState(false);
  const router = useRouter();
  const colorwayAbortRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleYarnSelect = async (yarn: RavelryYarn | null) => {
    if (!yarn) return;

    // Abort previous colorway fetch if any
    if (colorwayAbortRef.current) {
      colorwayAbortRef.current.abort();
    }
    const controller = new AbortController();
    colorwayAbortRef.current = controller;

    setFormData((prev) => ({
      ...prev,
      name: `${yarn.yarn_company_name} ${yarn.name}`,
      ravelry_id: yarn.id,
      colorway: '',
      colorway_id: '',
      grams_per_skein: '',
      meters_per_skein: '',
      skeins: '',
    }));

    setIsFetchingColorways(true);
    try {
      const res = await fetch(`/api/ravelry/yarns/${yarn.id}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.yarn) {
          // Auto-populate weight specs from Ravelry
          const yarnData = data.yarn;
          setFormData((prev) => ({
            ...prev,
            grams_per_skein: yarnData.grams ? String(yarnData.grams) : '',
            // Convert yardage to meters (1 yard = 0.9144 meters)
            meters_per_skein: yarnData.yardage
              ? String(Math.round(yarnData.yardage * 0.9144))
              : '',
          }));
        }
        if (data.colorways) {
          setColorways(data.colorways);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Failed to fetch colorways:', error);
    } finally {
      if (colorwayAbortRef.current === controller) {
        setIsFetchingColorways(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Yarn name is required');
      return;
    }
    if (!formData.colorway.trim()) {
      alert('Colorway is required');
      return;
    }
    if (!formData.total_grams || Number.parseInt(formData.total_grams) < 0) {
      alert('Total grams is required');
      return;
    }

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
    const skeinCount = gramsPerSkein
      ? Math.round((totalGrams / gramsPerSkein) * 10) / 10
      : 0;

    const { data: yarn, error } = await supabase
      .from('yarns')
      .insert({
        name: formData.name,
        colorway: formData.colorway,
        skein_count: Math.round(skeinCount),
        total_grams: totalGrams,
        grams_per_skein: gramsPerSkein,
        meters_per_skein: metersPerSkein,
        lot_number: formData.lot_number || null,
        notes: formData.notes || null,
        is_active: totalGrams > 0,
        user_id: user.id,
        ravelry_id: formData.ravelry_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating yarn:', error);
      setIsLoading(false);
      return;
    }

    // Upload images if any
    if (files.length > 0 && yarn) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('yarn-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        const { error: imageError } = await supabase
          .from('yarn_images')
          .insert({
            yarn_id: yarn.id,
            storage_path: fileName,
          });

        if (imageError) {
          console.error('Error linking image:', imageError);
        }
      }
    }

    setIsLoading(false);
    setFormData({
      name: '',
      colorway: '',
      total_grams: '',
      skeins: '',
      grams_per_skein: '',
      meters_per_skein: '',
      lot_number: '',
      notes: '',
      ravelry_id: null,
      colorway_id: '',
    });
    setFiles([]);
    setColorways([]);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Yarn</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Yarn</DialogTitle>
          <DialogDescription>
            Add a new yarn to your inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <YarnAutocomplete
              onSelect={handleYarnSelect}
              onManualInput={(name) =>
                setFormData((prev) => ({ ...prev, name }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorway">Colorway *</Label>
            <ColorwayAutocomplete
              colorways={colorways}
              onSelect={(colorway) => {
                if (colorway) {
                  setFormData((prev) => ({
                    ...prev,
                    colorway: colorway.name
                      ? `${colorway.code} - ${colorway.name}`
                      : colorway.code,
                    colorway_id: colorway.id.toString(),
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    colorway: '',
                    colorway_id: '',
                  }));
                }
              }}
              onManualInput={(val) => {
                setFormData((prev) => ({
                  ...prev,
                  colorway: val,
                  colorway_id: '',
                }));
              }}
              disabled={isFetchingColorways}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="skeins">Skeins *</Label>
              <Input
                id="skeins"
                type="number"
                required
                min="0"
                value={formData.skeins}
                onChange={(e) => {
                  const val = e.target.value;
                  const skeins = Number.parseFloat(val);
                  const gps = Number.parseFloat(formData.grams_per_skein);

                  setFormData({
                    ...formData,
                    skeins: val,
                    total_grams:
                      skeins && gps
                        ? String(Math.round(skeins * gps))
                        : formData.total_grams,
                  });
                }}
                placeholder="Number of skeins"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_grams">Total Grams</Label>
              <Input
                id="total_grams"
                type="number"
                min="0"
                value={formData.total_grams}
                onChange={(e) => {
                  const val = e.target.value;
                  const grams = Number.parseFloat(val);
                  const gps = Number.parseFloat(formData.grams_per_skein);

                  setFormData({
                    ...formData,
                    total_grams: val,
                    skeins:
                      grams && gps
                        ? String(Math.round((grams / gps) * 100) / 100)
                        : formData.skeins,
                  });
                }}
                placeholder="Calculated from skeins"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="grams_per_skein">Grams/Skein</Label>
              <Input
                id="grams_per_skein"
                type="number"
                min="1"
                value={formData.grams_per_skein}
                onChange={(e) => {
                  const val = e.target.value;
                  const gps = Number.parseFloat(val);
                  const skeins = Number.parseFloat(formData.skeins);
                  const grams = Number.parseFloat(formData.total_grams);

                  let updates: any = { grams_per_skein: val };

                  if (skeins && gps) {
                    updates.total_grams = String(Math.round(skeins * gps));
                  } else if (grams && gps) {
                    updates.skeins = String(
                      Math.round((grams / gps) * 100) / 100,
                    );
                  }

                  setFormData({ ...formData, ...updates });
                }}
                placeholder="e.g., 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meters_per_skein">Meters/Skein</Label>
              <Input
                id="meters_per_skein"
                type="number"
                min="1"
                value={formData.meters_per_skein}
                onChange={(e) =>
                  setFormData({ ...formData, meters_per_skein: e.target.value })
                }
                placeholder="e.g., 200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot_number">Lot Number</Label>
            <Input
              id="lot_number"
              value={formData.lot_number}
              onChange={(e) =>
                setFormData({ ...formData, lot_number: e.target.value })
              }
              placeholder="e.g., LOT456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
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
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 text-sm border rounded"
                  >
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
            {isLoading ? 'Adding...' : 'Add Yarn'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
