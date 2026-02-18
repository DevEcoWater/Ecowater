interface Team {
  name: string;
  logo: React.ElementType;
  plan: string;
}

interface BaseNavItem {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  url: string;
}

type NavLink = BaseNavItem & {
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: BaseNavItem[];
  url?: string;
};

type NavItem = NavCollapsible | NavLink;

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarData {
  teams: Team[];
  navGroups: NavGroup[];
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink };
