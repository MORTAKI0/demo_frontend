import type {
  PrimaryTransformerPhaseId,
} from "../domain/types";

export const PRIMARY_TRANSFORMER_PHASE_WEIGHTS = {
  STAGE_PREPARATION: 5,
  SOURCE_BASELINE: 20,
  DISCOVERY: 12,
  TARGET_AUTHORITY_MATERIALIZATION: 22,
  MIGRATION_OWNERS_TRANSFORMATION_REVIEW: 15,
  CLEAN_VALIDATION: 20,
  POST_VALIDATION_AUTHORITY_SEAL: 6,
} as const satisfies Record<PrimaryTransformerPhaseId, number>;

export type TransformerNodeOperationKind =
  | "CONTROL"
  | "WORKSPACE"
  | "COMMAND"
  | "EVIDENCE"
  | "DEPENDENCY"
  | "MIGRATION"
  | "VALIDATION"
  | "POST_VALIDATION";

export interface TransformerNodeDefinition {
  id: string;
  phaseId: PrimaryTransformerPhaseId;
  label: string;
  operationKind: TransformerNodeOperationKind;
  commandId?: string;
}

function node(
  id: string,
  phaseId: PrimaryTransformerPhaseId,
  label: string,
  operationKind: TransformerNodeOperationKind,
  commandId?: string,
): TransformerNodeDefinition {
  return { id, phaseId, label, operationKind, commandId };
}

export const PROVEN_NODE_CATALOGUE = [
  node("select_run_mode", "STAGE_PREPARATION", "Select run mode", "CONTROL"),
  node("prepare_stage_layout", "STAGE_PREPARATION", "Prepare stage layout", "WORKSPACE"),

  node("create_source_baseline", "SOURCE_BASELINE", "Create source baseline", "WORKSPACE"),
  node("construct_dependency_intent", "SOURCE_BASELINE", "Construct dependency intent", "DEPENDENCY"),
  node("bind_npm_lock_authority_policy", "SOURCE_BASELINE", "Bind npm lock authority policy", "DEPENDENCY"),
  node("select_source_lock_authority", "SOURCE_BASELINE", "Select source lock authority", "DEPENDENCY"),
  node("read_source_resolved_lock", "SOURCE_BASELINE", "Read source resolved lock", "EVIDENCE"),
  node("prove_source_manifest_vs_resolution", "SOURCE_BASELINE", "Prove source manifest against resolution", "EVIDENCE"),
  node("source_install_same_authority", "SOURCE_BASELINE", "Install source with same authority", "COMMAND", "npm-ci-bootstrap"),
  node("source_tree", "SOURCE_BASELINE", "Capture source dependency tree", "COMMAND", "npm-dependency-tree"),
  node("source_version_proof", "SOURCE_BASELINE", "Prove source versions", "COMMAND", "angular-version-verify"),
  node("source_build", "SOURCE_BASELINE", "Build source application", "COMMAND", "npm-script-build-production"),
  node("source_test", "SOURCE_BASELINE", "Run source tests", "COMMAND", "npm-script-test-ci"),
  node("source_diagnostic_capture", "SOURCE_BASELINE", "Capture source diagnostics", "EVIDENCE"),
  node("freeze_source_baseline", "SOURCE_BASELINE", "Freeze source baseline", "EVIDENCE"),

  node("create_discovery_generation", "DISCOVERY", "Create disposable discovery generation", "WORKSPACE"),
  node("prepare_discovery_toolchain", "DISCOVERY", "Prepare discovery toolchain", "DEPENDENCY"),
  node("prove_discovery_cli_authority", "DISCOVERY", "Prove discovery CLI authority", "COMMAND", "angular-cli-authority-version"),
  node("run_discovery", "DISCOVERY", "Run Angular migration discovery", "COMMAND", "angular-update-discovery"),
  node("assess_discovery", "DISCOVERY", "Assess discovery evidence", "EVIDENCE"),
  node("persist_target_intent", "DISCOVERY", "Persist target intent", "EVIDENCE"),
  node("discard_discovery", "DISCOVERY", "Discard discovery generation", "WORKSPACE"),

  node("create_authoritative_target", "TARGET_AUTHORITY_MATERIALIZATION", "Create authoritative target", "WORKSPACE"),
  node("apply_target_intent", "TARGET_AUTHORITY_MATERIALIZATION", "Apply target intent", "DEPENDENCY"),
  node("dependency_plan", "TARGET_AUTHORITY_MATERIALIZATION", "Resolve dependency plan", "DEPENDENCY"),
  node("select_target_lock_authority", "TARGET_AUTHORITY_MATERIALIZATION", "Select target lock authority", "DEPENDENCY"),
  node("lock_resolution", "TARGET_AUTHORITY_MATERIALIZATION", "Generate target lockfile", "COMMAND", "npm-lockfile-generate"),
  node("create_materialization", "TARGET_AUTHORITY_MATERIALIZATION", "Create target materialization", "WORKSPACE"),
  node("target_install_same_authority", "TARGET_AUTHORITY_MATERIALIZATION", "Install target with same authority", "COMMAND", "npm-ci-final"),
  node("target_tree", "TARGET_AUTHORITY_MATERIALIZATION", "Capture target dependency tree", "COMMAND", "npm-dependency-tree"),
  node("target_version_proof", "TARGET_AUTHORITY_MATERIALIZATION", "Prove target versions", "COMMAND", "angular-version-verify"),

  node("inspect_migration_metadata", "MIGRATION_OWNERS_TRANSFORMATION_REVIEW", "Inspect migration metadata", "MIGRATION"),
  node("build_migration_ledger", "MIGRATION_OWNERS_TRANSFORMATION_REVIEW", "Build migration-owner ledger", "MIGRATION"),
  node("execute_migration_owner", "MIGRATION_OWNERS_TRANSFORMATION_REVIEW", "Execute migration owner", "MIGRATION"),
  node("compare_dependency_authority", "MIGRATION_OWNERS_TRANSFORMATION_REVIEW", "Compare dependency authority", "DEPENDENCY"),
  node("freeze_target_authority", "MIGRATION_OWNERS_TRANSFORMATION_REVIEW", "Freeze target authority", "EVIDENCE"),

  node("create_validation_generation", "CLEAN_VALIDATION", "Create clean validation generation", "WORKSPACE"),
  node("validation_install", "CLEAN_VALIDATION", "Install validation dependencies", "COMMAND", "npm-ci-final"),
  node("validation_tree", "CLEAN_VALIDATION", "Capture validation dependency tree", "COMMAND", "npm-dependency-tree"),
  node("validation_version_proof", "CLEAN_VALIDATION", "Prove validation versions", "COMMAND", "angular-version-verify"),
  node("validation_build", "CLEAN_VALIDATION", "Build validation generation", "COMMAND", "npm-script-build-production"),
  node("validation_test", "CLEAN_VALIDATION", "Run validation tests", "COMMAND", "npm-script-test-ci"),
  node("diagnostic_delta", "CLEAN_VALIDATION", "Calculate diagnostic delta", "VALIDATION"),
  node("aggregate_proven_validation", "CLEAN_VALIDATION", "Aggregate PROVEN validation", "VALIDATION"),

  node("promotion_pending", "POST_VALIDATION_AUTHORITY_SEAL", "Evaluate post-validation authority", "POST_VALIDATION"),
  node("promote_validated", "POST_VALIDATION_AUTHORITY_SEAL", "Promote validated candidate", "POST_VALIDATION"),
] as const satisfies readonly TransformerNodeDefinition[];

export const PROVEN_NODE_IDS = PROVEN_NODE_CATALOGUE.map((entry) => entry.id);
