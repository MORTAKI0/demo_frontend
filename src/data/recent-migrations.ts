export interface RecentMigration {
  id: string;
  name: string;
  stack: "Angular" | "Spring Boot";
  route: string;
  status: "ACTION_REQUIRED" | "RUNNING" | "COMPLETED";
  href: string;
  updated: string;
}

export const recentMigrations: RecentMigration[] = [
  {
    id: "ang-crud-action",
    name: "Angular 11 CRUD Example",
    stack: "Angular",
    route: "Angular 11 → 21",
    status: "ACTION_REQUIRED",
    href: "/angular/migrations/run-angular-action",
    updated: "2 min ago",
  },
  {
    id: "java-order-service",
    name: "Order Service",
    stack: "Spring Boot",
    route: "Spring Boot 2.1 → 4.0",
    status: "RUNNING",
    href: "/java/migrations/java-order-service",
    updated: "8 min ago",
  },
  {
    id: "java-repair-service",
    name: "Payments Service",
    stack: "Spring Boot",
    route: "Spring Boot 2.1 → 4.0",
    status: "ACTION_REQUIRED",
    href: "/java/migrations/java-repair-service",
    updated: "12 min ago",
  },
  {
    id: "java-terminal-service",
    name: "Terminal Migration",
    stack: "Spring Boot",
    route: "Spring Boot 2.1 → 4.0",
    status: "COMPLETED",
    href: "/java/migrations/java-terminal-service",
    updated: "34 min ago",
  },
  {
    id: "ang-crud-complete",
    name: "Angular 11 CRUD Example",
    stack: "Angular",
    route: "Angular 11 → 21",
    status: "COMPLETED",
    href: "/angular/migrations/run-angular-complete",
    updated: "Yesterday",
  },
];
