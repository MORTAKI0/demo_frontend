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
    id: "ang-customer-portal",
    name: "Customer Portal",
    stack: "Angular",
    route: "Angular 11 → 15",
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
    id: "ang-legacy-admin",
    name: "Legacy Admin",
    stack: "Angular",
    route: "Angular 18 → 21",
    status: "COMPLETED",
    href: "/angular/migrations/run-angular-complete",
    updated: "Yesterday",
  },
];
