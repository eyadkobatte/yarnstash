"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDebounce } from "@/lib/hooks/use-debounce"
import Image from "next/image"

export interface RavelryYarn {
  id: number
  name: string
  yarn_company_name: string
  first_photo?: {
    small_url: string
    thumbnail_url: string
  } | null
}

interface YarnAutocompleteProps {
  onSelect: (yarn: RavelryYarn | null) => void
  onManualInput: (name: string) => void
}

export function YarnAutocomplete({ onSelect, onManualInput }: YarnAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<number | null>(null)
  const [selectedName, setSelectedName] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [yarns, setYarns] = React.useState<RavelryYarn[]>([])
  const [loading, setLoading] = React.useState(false)
  
  const debouncedQuery = useDebounce(query, 300)

  React.useEffect(() => {
    const controller = new AbortController()

    async function fetchYarns() {
      if (!debouncedQuery) {
        setYarns([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(
          `/api/ravelry/yarns/search?query=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setYarns(data.yarns || [])
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        console.error("Failed to fetch yarns:", error)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchYarns()

    return () => {
      controller.abort()
    }
  }, [debouncedQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedName || query || "Search yarn database..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search yarn..." 
            value={query}
            onValueChange={(val: string) => {
              setQuery(val)
              onManualInput(val) // Allow manual input while typing
              if (!val) {
                setValue(null)
                setSelectedName("")
              }
            }}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>{loading ? "Searching..." : "No yarn found (press enter to use raw input)."}</CommandEmpty>
            <CommandGroup>
              {yarns.map((yarn) => (
                <CommandItem
                  key={yarn.id}
                  value={yarn.id.toString()}
                  onSelect={() => {
                    setValue(yarn.id)
                    setSelectedName(yarn.name)
                    onSelect(yarn)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === yarn.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {yarn.first_photo?.thumbnail_url ? (
                      <Image
                        src={yarn.first_photo.thumbnail_url}
                        alt={yarn.name}
                        className="h-8 w-8 rounded object-cover"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">No img</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{yarn.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {yarn.yarn_company_name}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
