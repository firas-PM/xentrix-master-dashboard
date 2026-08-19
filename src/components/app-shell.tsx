"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SessionMembership } from "@/auth";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Cog,
  Users,
  ListTodo,
  FolderKanban,
  Inbox,
  Repeat,
  BarChart3,
  Receipt,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth-actions";
import { CommandBar } from "@/components/command-bar";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  user: { name?: string | null; email?: string | null; isFounder: boolean };
  memberships: SessionMembership[];
  captureBrands: { slug: string; name: string }[];
  children: React.ReactNode;
};

export function AppShell({ user, memberships, captureBrands, children }: Props) {
  const pathname = usePathname();
  const activeBrandSlug = useMemo(() => {
    const m = pathname.match(/^\/b\/([^/]+)/);
    return m ? m[1] : undefined;
  }, [pathname]);

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer whenever route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <header className="md:hidden fixed inset-x-0 top-0 z-30 flex items-center gap-3 h-14 px-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)] transition"
        >
          <Menu className="size-5" />
        </button>
        <XentrixMark className="h-6 w-auto" />
        <div className="text-sm font-semibold tracking-tight flex-1 min-w-0 truncate">
          Xentrix
        </div>
        <ThemeToggle />
      </header>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)]",
          // Desktop: static column
          "md:static md:w-64 md:shrink-0 md:translate-x-0",
          // Mobile: fixed drawer
          "fixed z-50 inset-y-0 left-0 w-72 transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="px-5 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <XentrixMark className="h-8 w-auto" />
            <div className="leading-tight flex-1 min-w-0">
              <div className="text-sm font-semibold tracking-tight">Xentrix</div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">
                Master Dashboard
              </div>
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="md:hidden p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)] transition"
            >
              <X className="size-4" />
            </button>
            <kbd className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border-strong)] text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          <SectionLabel>You</SectionLabel>
          <NavItem href="/my" icon={Inbox} active={pathname.startsWith("/my")}>
            My work
          </NavItem>
          {user.isFounder && (
            <NavItem href="/" icon={LayoutDashboard} active={pathname === "/"}>
              All brands
            </NavItem>
          )}

          <SectionLabel className="mt-4">Brands</SectionLabel>
          {memberships.length === 0 && !user.isFounder && (
            <div className="px-3 py-2 text-xs text-[var(--text-subtle)]">
              You haven&apos;t been added to any brand yet.
            </div>
          )}
          {memberships.map((m) => (
            <NavItem
              key={m.brandId || m.brandSlug}
              href={`/b/${m.brandSlug}`}
              icon={Building2}
              active={activeBrandSlug === m.brandSlug}
            >
              {m.brandName}
              <span className="ml-auto text-[10px] text-[var(--text-subtle)] uppercase tracking-wide">
                {m.role.replace("_", " ")}
              </span>
            </NavItem>
          ))}

          {activeBrandSlug && (
            <>
              <SectionLabel className="mt-4">This brand</SectionLabel>
              <NavItem
                href={`/b/${activeBrandSlug}/tasks`}
                icon={ListTodo}
                active={pathname.startsWith(`/b/${activeBrandSlug}/tasks`)}
              >
                Tasks
              </NavItem>
              <NavItem
                href={`/b/${activeBrandSlug}/projects`}
                icon={FolderKanban}
                active={pathname.startsWith(`/b/${activeBrandSlug}/projects`)}
              >
                Projects
              </NavItem>
              <NavItem
                href={`/b/${activeBrandSlug}/team`}
                icon={Users}
                active={pathname.startsWith(`/b/${activeBrandSlug}/team`)}
              >
                Team
              </NavItem>
              <NavItem
                href={`/b/${activeBrandSlug}/recurring`}
                icon={Repeat}
                active={pathname.startsWith(`/b/${activeBrandSlug}/recurring`)}
              >
                Recurring
              </NavItem>
              <NavItem
                href={`/b/${activeBrandSlug}/utilization`}
                icon={BarChart3}
                active={pathname.startsWith(`/b/${activeBrandSlug}/utilization`)}
              >
                Utilization
              </NavItem>
              <NavItem
                href={`/b/${activeBrandSlug}/invoices`}
                icon={Receipt}
                active={pathname.startsWith(`/b/${activeBrandSlug}/invoices`)}
              >
                Invoices
              </NavItem>
            </>
          )}

          {user.isFounder && (
            <>
              <SectionLabel className="mt-4">Admin</SectionLabel>
              <NavItem
                href="/admin/brands"
                icon={Cog}
                active={pathname.startsWith("/admin/brands")}
              >
                Manage brands
              </NavItem>
              <NavItem
                href="/admin/users"
                icon={Users}
                active={pathname.startsWith("/admin/users")}
              >
                Manage users
              </NavItem>
            </>
          )}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="px-2 pb-3">
            <div className="text-sm font-medium truncate">{user.name ?? "Unnamed"}</div>
            <div className="text-xs text-[var(--text-subtle)] truncate">{user.email}</div>
          </div>
          <Link
            href="/settings/account"
            className={cn(
              "relative w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition mb-1",
              pathname.startsWith("/settings")
                ? "bg-[var(--bg-sunken)] text-[var(--text)] font-medium"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)]"
            )}
          >
            {pathname.startsWith("/settings") && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--accent)]" />
            )}
            <Cog className="size-4" />
            Account settings
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)] transition"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-[var(--bg)] pt-14 md:pt-0">{children}</main>
      <CommandBar brands={captureBrands} />
    </div>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--text-subtle)] font-semibold",
        className
      )}
    >
      {children}
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  active,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
        active
          ? "bg-[var(--bg-sunken)] text-[var(--text)] font-medium"
          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)]"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--accent)]" />
      )}
      <Icon className="size-4 shrink-0" />
      <span className="truncate flex-1 flex items-center">{children}</span>
    </Link>
  );
}

/**
 * Actual Xentrix logo — X letterform + gold triangle apex.
 * X path uses currentColor so it inverts correctly on dark theme.
 */
function XentrixMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 315 398"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Xentrix"
    >
      <path
        d="M129.912 221.819L8.62251 59.1134H61.0761L157.361 190.684L253.933 59.1134H306.386L185.096 221.819L315.009 397.868H262.412L157.361 252.667L52.5973 397.868H0L129.912 221.819Z"
        fill="currentColor"
      />
      <path d="M56.4774 0H258.388L157.504 139.031L56.4774 0Z" fill="#FFC800" />
    </svg>
  );
}
