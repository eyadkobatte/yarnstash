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

export interface RavelryColorway {
  id: number
  name: string
  code: string
}

interface ColorwayAutocompleteProps {
  colorways: RavelryColorway[]
  onSelect: (colorway: RavelryColorway | null) => void
  onManualInput: (value: string) => void
  disabled?: boolean
}

export function ColorwayAutocomplete({ colorways, onSelect, onManualInput, disabled }: ColorwayAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string>("")
  const [query, setQuery] = React.useState("")
  const [selectedDisplay, setSelectedDisplay] = React.useState("")

  // Reset state when colorways change (e.g. when a new yarn is selected)
  React.useEffect(() => {
    setValue("")
    setQuery("")
    setSelectedDisplay("")
  }, [colorways])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedDisplay || query || "Select or type a color..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput 
            placeholder="Search colorway..." 
            value={query}
            onValueChange={(val: string) => {
              setQuery(val)
              onManualInput(val)
              if (!val) {
                setValue("")
                setSelectedDisplay("")
              }
            }}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No colorway found. Use &quot;{query}&quot; as custom input.</CommandEmpty>
            <CommandGroup>
              {colorways.map((colorway) => {
                const displayName = colorway.code + (colorway.name ? ` - ${colorway.name}` : "")
                return (
                  <CommandItem
                    key={colorway.id}
                    value={displayName}
                    onSelect={() => {
                      setValue(colorway.id.toString())
                      setSelectedDisplay(displayName)
                      onSelect(colorway)
                      setOpen(false)
                      setQuery("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === colorway.id.toString() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{displayName}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
