"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { SessionMembership } from "@/auth";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Cog,
  Users,
  ListTodo,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth-actions";

type Props = {
  user: { name?: string | null; email?: string | null; isFounder: boolean };
  memberships: SessionMembership[];
  children: React.ReactNode;
};

export function AppShell({ user, memberships, children }: Props) {
  const pathname = usePathname();
  const activeBrandSlug = useMemo(() => {
    const m = pathname.match(/^\/b\/([^/]+)/);
    return m ? m[1] : undefined;
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-neutral-900 bg-neutral-950 flex flex-col">
        <div className="px-5 py-5 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-indigo-500/20 border border-indigo-500/40 grid place-items-center text-indigo-300 text-sm font-semibold">
              X
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">Xentrix</div>
              <div className="text-[11px] text-neutral-500">Master Dashboard</div>
            </div>
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          {user.isFounder && <SectionLabel>Overview</SectionLabel>}
          {user.isFounder && (
            <NavItem
              href="/"
              icon={LayoutDashboard}
              active={pathname === "/"}
            >
              All brands
            </NavItem>
          )}

          <SectionLabel className={user.isFounder ? "mt-4" : ""}>Brands</SectionLabel>
          {memberships.length === 0 && !user.isFounder && (
            <div className="px-3 py-2 text-xs text-neutral-500">
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
              <span className="ml-auto text-[10px] text-neutral-500 uppercase tracking-wide">
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

        <div className="border-t border-neutral-900 p-3">
          <div className="px-2 pb-3">
            <div className="text-sm truncate">{user.name ?? "Unnamed"}</div>
            <div className="text-xs text-neutral-500 truncate">{user.email}</div>
          </div>
          <Link
            href="/settings/account"
            className={cn(
              "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition mb-1",
              pathname.startsWith("/settings")
                ? "bg-neutral-900 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            )}
          >
            <Cog className="size-4" />
            Account settings
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
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
        "px-3 py-1 text-[10px] uppercase tracking-wider text-neutral-500",
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
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-400 hover:text-white hover:bg-neutral-900"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate flex-1 flex items-center">{children}</span>
    </Link>
  );
}
