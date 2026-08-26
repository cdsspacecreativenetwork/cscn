"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className = "", ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={`flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-white text-[#040B37] ${className}`}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className = "", ...props }, ref) => (
  <div className="p-3 border-b border-[#E3E8F4]">
    <div className="relative flex items-center w-full rounded-[10px]">
      <Search className="absolute left-3.5 h-4 w-4 shrink-0 text-[#9CA3AF] pointer-events-none" />
      <CommandPrimitive.Input
        ref={ref}
        className={`flex h-10 w-full rounded-[10px] bg-transparent pl-10 pr-3 text-[13.5px] font-medium text-[#040B37] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 border-none shadow-none ${className}`}
        {...props}
      />
    </div>
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className = "", ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={`max-h-[260px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar ${className}`}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-[13px] font-semibold text-[#9CA3AF]"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className = "", ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={`overflow-hidden p-1 text-[#040B37] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-[#9CA3AF] [&_[cmdk-group-heading]]:uppercase ${className}`}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className = "", ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={`relative flex cursor-pointer select-none items-center rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-[#1C4ED1]/5 data-[selected=true]:text-[#1C4ED1] data-[disabled=true]:opacity-40 text-[#4B5563] transition-colors ${className}`}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
}
