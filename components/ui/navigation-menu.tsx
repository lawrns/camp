import * as React from "react";

const NavigationMenu = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className = "", ...props }, ref) => (
    <nav
      ref={ref}
      className={`relative z-10 flex max-w-max flex-1 items-center justify-center ${className}`}
      {...props}
    />
  )
);
NavigationMenu.displayName = "NavigationMenu";

const NavigationMenuList = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className = "", ...props }, ref) => (
    <ul
      ref={ref}
      className={`group flex flex-1 list-none items-center justify-center space-x-1 ${className}`}
      {...props}
    />
  )
);
NavigationMenuList.displayName = "NavigationMenuList";

const NavigationMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className = "", ...props }, ref) => <li ref={ref} className={className} {...props} />
);
NavigationMenuItem.displayName = "NavigationMenuItem";

export { NavigationMenu, NavigationMenuItem, NavigationMenuList };
