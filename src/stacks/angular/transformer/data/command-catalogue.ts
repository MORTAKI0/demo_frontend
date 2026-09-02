import type { TransformerTimingOperation } from "../domain/timing.ts";

export type TransformerWorkspaceAliasClass =
  | "SOURCE_BASELINE"
  | "DISCOVERY"
  | "AUTHORITATIVE_TARGET"
  | "VALIDATION"
  | "GOVERNED_STAGE";

export type TransformerNetworkPolicy =
  | "PACKAGE_REGISTRY_ALLOWED"
  | "OFFLINE"
  | "GOVERNED_DISCOVERY";

export interface TransformerCommandDefinition {
  commandId: string;
  templateId: string;
  label: string;
  shell: false;
  timeoutMs: number;
  workspaceAliasClass: TransformerWorkspaceAliasClass;
  networkPolicy: TransformerNetworkPolicy;
  timingOperation: TransformerTimingOperation;
}

function command(
  commandId: string,
  label: string,
  workspaceAliasClass: TransformerWorkspaceAliasClass,
  networkPolicy: TransformerNetworkPolicy,
  timingOperation: TransformerTimingOperation,
  timeoutMs = 600_000,
): TransformerCommandDefinition {
  return {
    commandId,
    templateId: commandId,
    label,
    shell: false,
    timeoutMs,
    workspaceAliasClass,
    networkPolicy,
    timingOperation,
  };
}

export const TRANSFORMER_COMMAND_CATALOGUE = [
  command(
    "npm-ci-bootstrap",
    "Install source dependencies",
    "SOURCE_BASELINE",
    "PACKAGE_REGISTRY_ALLOWED",
    "SOURCE_INSTALL",
  ),
  command(
    "npm-ci-final",
    "Install authoritative dependencies",
    "VALIDATION",
    "PACKAGE_REGISTRY_ALLOWED",
    "VALIDATION_INSTALL",
  ),
  command(
    "npm-dependency-tree",
    "Capture dependency tree",
    "GOVERNED_STAGE",
    "OFFLINE",
    "SOURCE_PROOF",
  ),
  command(
    "npm-lockfile-generate",
    "Generate package-lock authority",
    "AUTHORITATIVE_TARGET",
    "PACKAGE_REGISTRY_ALLOWED",
    "LOCK_GENERATION",
  ),
  command(
    "angular-update-discovery",
    "Discover Angular migration metadata",
    "DISCOVERY",
    "GOVERNED_DISCOVERY",
    "DISCOVERY",
  ),
  command(
    "angular-cli-authority-version",
    "Prove Angular CLI authority",
    "DISCOVERY",
    "OFFLINE",
    "SOURCE_PROOF",
  ),
  command(
    "angular-version-verify",
    "Verify Angular versions",
    "GOVERNED_STAGE",
    "OFFLINE",
    "TARGET_PROOF",
  ),
  command(
    "npm-script-build-production",
    "Run production build",
    "GOVERNED_STAGE",
    "OFFLINE",
    "VALIDATION_BUILD",
  ),
  command(
    "npm-script-test-ci",
    "Run configured tests",
    "GOVERNED_STAGE",
    "OFFLINE",
    "VALIDATION_TEST",
  ),
  command(
    "npm-script-lint",
    "Run configured lint",
    "VALIDATION",
    "OFFLINE",
    "DIAGNOSTIC_AGGREGATION",
  ),
  command(
    "npm-dependency-materialize",
    "Materialize dependency plan",
    "AUTHORITATIVE_TARGET",
    "PACKAGE_REGISTRY_ALLOWED",
    "TARGET_INSTALL",
  ),
  command(
    "npm-angular-lockfile-normalize",
    "Normalize Angular lockfile",
    "AUTHORITATIVE_TARGET",
    "PACKAGE_REGISTRY_ALLOWED",
    "LOCK_GENERATION",
  ),
  command(
    "npm-dependency-uninstall",
    "Detach incompatible dependency",
    "AUTHORITATIVE_TARGET",
    "PACKAGE_REGISTRY_ALLOWED",
    "MIGRATION_OWNER",
  ),
  command(
    "npm-dependency-install",
    "Install compatible dependency",
    "AUTHORITATIVE_TARGET",
    "PACKAGE_REGISTRY_ALLOWED",
    "MIGRATION_OWNER",
  ),
  command(
    "angular-migrate-installed",
    "Run installed Angular migration owner",
    "AUTHORITATIVE_TARGET",
    "OFFLINE",
    "MIGRATION_OWNER",
  ),
  command(
    "angular-migrate-range-v2",
    "Run Angular migration range",
    "AUTHORITATIVE_TARGET",
    "OFFLINE",
    "MIGRATION_OWNER",
  ),
  command(
    "angular-migrate-name-v2",
    "Run named Angular migration",
    "AUTHORITATIVE_TARGET",
    "OFFLINE",
    "MIGRATION_OWNER",
  ),
] as const satisfies readonly TransformerCommandDefinition[];

export const TRANSFORMER_COMMANDS_BY_ID = new Map(
  TRANSFORMER_COMMAND_CATALOGUE.map((entry) => [entry.commandId, entry]),
);
