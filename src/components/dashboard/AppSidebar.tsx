import { Link, useRouterState } from "@tanstack/react-router";
import {
  House, Bot, Upload, BarChart3, FileText, Layers, ClipboardList,
  GraduationCap, CalendarDays, Bookmark, Settings, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/landing/Logo";
import { useAuth } from "@/lib/auth-context";

const main = [
  { title: "Home", url: "/dashboard", icon: House },
  { title: "AI Chat", url: "/chat", icon: Bot },
  { title: "Uploads", url: "/uploads", icon: Upload },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];
const library = [
  { title: "Summaries", url: "/summaries", icon: FileText },
  { title: "Flashcards", url: "/flashcards", icon: Layers },
  { title: "Quizzes", url: "/quizzes", icon: ClipboardList },
];
const tools = [
  { title: "Exam Mode", url: "/exam", icon: GraduationCap },
  { title: "Planner", url: "/planner", icon: CalendarDays },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { signOut } = useAuth();
  const isActive = (url: string) => path === url || path.startsWith(url + "/");

  const renderGroup = (label: string, items: typeof main) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((it) => (
            <SidebarMenuItem key={it.url}>
              <SidebarMenuButton asChild isActive={isActive(it.url)}>
                <Link to={it.url} className="flex items-center gap-2">
                  <it.icon className="h-4 w-4" />
                  <span>{it.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-4">
        <Link to="/dashboard"><Logo /></Link>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Main", main)}
        {renderGroup("Library", library)}
        {renderGroup("Tools", tools)}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")}>
              <Link to="/settings"><Settings className="h-4 w-4" /><span>Settings</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()}>
              <LogOut className="h-4 w-4" /><span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
