import * as ContextMenu from "@radix-ui/react-context-menu";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
    /** Render a visual separator before this item */
    separator?: boolean;
    /** Nested submenu items */
    submenu?: Omit<MenuItem, "submenu">[];
}

interface MediaContextMenuProps {
    children: React.ReactNode;
    items: MenuItem[];
    /** Show a "⋯" hover button that opens a dropdown (useful on grid cards) */
    showMoreButton?: boolean;
}

// ─── Shared item classes ──────────────────────────────────────────────────────
const itemBase =
    "flex items-center gap-3 px-3 py-2 text-sm rounded-sm cursor-pointer outline-none select-none transition-colors";
const itemNormal = "text-white data-[highlighted]:bg-[#3e3e3e] data-[highlighted]:text-white";
const itemDestructive =
    "text-red-400 data-[highlighted]:bg-[#3e3e3e] data-[highlighted]:text-red-300";
const menuContent =
    "bg-[#282828] border border-[#404040] rounded-md shadow-2xl p-1 min-w-[200px] z-[200] animate-in fade-in-0 zoom-in-95";

// ─── Right-click context menu ─────────────────────────────────────────────────
function ContextMenuItems({ items }: { items: MenuItem[] }) {
    return (
        <>
            {items.map((item, i) => (
                <div key={i}>
                    {item.separator && (
                        <ContextMenu.Separator className="h-px bg-[#404040] my-1" />
                    )}
                    {item.submenu ? (
                        <ContextMenu.Sub>
                            <ContextMenu.SubTrigger
                                className={cn(itemBase, itemNormal, "justify-between")}
                            >
                                <span className="flex items-center gap-3">
                                    {item.icon}
                                    {item.label}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            </ContextMenu.SubTrigger>
                            <ContextMenu.Portal>
                                <ContextMenu.SubContent className={menuContent}>
                                    {item.submenu.map((sub, si) => (
                                        <div key={si}>
                                            {sub.separator && (
                                                <ContextMenu.Separator className="h-px bg-[#404040] my-1" />
                                            )}
                                            <ContextMenu.Item
                                                className={cn(
                                                    itemBase,
                                                    sub.destructive ? itemDestructive : itemNormal
                                                )}
                                                onClick={sub.onClick}
                                            >
                                                {sub.icon}
                                                {sub.label}
                                            </ContextMenu.Item>
                                        </div>
                                    ))}
                                </ContextMenu.SubContent>
                            </ContextMenu.Portal>
                        </ContextMenu.Sub>
                    ) : (
                        <ContextMenu.Item
                            className={cn(
                                itemBase,
                                item.destructive ? itemDestructive : itemNormal
                            )}
                            onClick={item.onClick}
                        >
                            {item.icon}
                            {item.label}
                        </ContextMenu.Item>
                    )}
                </div>
            ))}
        </>
    );
}

// ─── Dropdown (… button) items ────────────────────────────────────────────────
function DropdownItems({ items }: { items: MenuItem[] }) {
    return (
        <>
            {items.map((item, i) => (
                <div key={i}>
                    {item.separator && (
                        <DropdownMenu.Separator className="h-px bg-[#404040] my-1" />
                    )}
                    {item.submenu ? (
                        <DropdownMenu.Sub>
                            <DropdownMenu.SubTrigger
                                className={cn(itemBase, itemNormal, "justify-between")}
                            >
                                <span className="flex items-center gap-3">
                                    {item.icon}
                                    {item.label}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            </DropdownMenu.SubTrigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.SubContent className={menuContent}>
                                    {item.submenu.map((sub, si) => (
                                        <div key={si}>
                                            {sub.separator && (
                                                <DropdownMenu.Separator className="h-px bg-[#404040] my-1" />
                                            )}
                                            <DropdownMenu.Item
                                                className={cn(
                                                    itemBase,
                                                    sub.destructive ? itemDestructive : itemNormal
                                                )}
                                                onClick={sub.onClick}
                                            >
                                                {sub.icon}
                                                {sub.label}
                                            </DropdownMenu.Item>
                                        </div>
                                    ))}
                                </DropdownMenu.SubContent>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Sub>
                    ) : (
                        <DropdownMenu.Item
                            className={cn(
                                itemBase,
                                item.destructive ? itemDestructive : itemNormal
                            )}
                            onClick={item.onClick}
                        >
                            {item.icon}
                            {item.label}
                        </DropdownMenu.Item>
                    )}
                </div>
            ))}
        </>
    );
}

/**
 * Wraps children in a right-click context menu. Optionally shows a "⋯" hover
 * button that opens the same options as a dropdown — consistent everywhere.
 */
export default function MediaContextMenu({
    children,
    items,
    showMoreButton = false,
}: MediaContextMenuProps) {
    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                <div className="relative group/ctx">
                    {children}

                    {/* ⋯ button — only when showMoreButton is true */}
                    {showMoreButton && (
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button
                                    className={cn(
                                        "absolute top-2 right-2 w-8 h-8 rounded-full",
                                        "flex items-center justify-center",
                                        "bg-black/60 text-white",
                                        "opacity-0 group-hover/ctx:opacity-100",
                                        "transition-opacity duration-150",
                                        "hover:bg-black/80 focus:outline-none z-10"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className={menuContent}
                                    side="bottom"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownItems items={items} />
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    )}
                </div>
            </ContextMenu.Trigger>

            <ContextMenu.Portal>
                <ContextMenu.Content className={menuContent}>
                    <ContextMenuItems items={items} />
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}
