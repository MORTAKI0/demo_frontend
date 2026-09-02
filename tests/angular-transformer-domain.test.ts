import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIMARY_TRANSFORMER_PHASE_WEIGHTS,
  PROVEN_NODE_CATALOGUE,
  PROVEN_NODE_IDS,
} from "../src/stacks/angular/transformer/data/node-catalogue.ts";
import {
  CANDIDATE_PROMOTION_GATE_POLICY,
  DIRECT_SEAL_GATE_POLICY,
} from "../src/stacks/angular/transformer/domain/scenarios.ts";

const EXPECTED_PROVEN_NODES = [
  "select_run_mode",
  "prepare_stage_layout",
  "create_source_baseline",
  "construct_dependency_intent",
  "bind_npm_lock_authority_policy",
  "select_source_lock_authority",
  "read_source_resolved_lock",
  "prove_source_manifest_vs_resolution",
  "source_install_same_authority",
  "source_tree",
  "source_version_proof",
  "source_build",
  "source_test",
  "source_diagnostic_capture",
  "freeze_source_baseline",
  "create_discovery_generation",
  "prepare_discovery_toolchain",
  "prove_discovery_cli_authority",
  "run_discovery",
  "assess_discovery",
  "persist_target_intent",
  "discard_discovery",
  "create_authoritative_target",
  "apply_target_intent",
  "dependency_plan",
  "select_target_lock_authority",
  "lock_resolution",
  "create_materialization",
  "target_install_same_authority",
  "target_tree",
  "target_version_proof",
  "inspect_migration_metadata",
  "build_migration_ledger",
  "execute_migration_owner",
  "compare_dependency_authority",
  "freeze_target_authority",
  "create_validation_generation",
  "validation_install",
  "validation_tree",
  "validation_version_proof",
  "validation_build",
  "validation_test",
  "diagnostic_delta",
  "aggregate_proven_validation",
  "promotion_pending",
  "promote_validated",
] as const;

test("Transformer node catalogue exactly matches locked v2.3 ProvenTransformationNode", () => {
  assert.deepEqual(PROVEN_NODE_IDS, EXPECTED_PROVEN_NODES);
  assert.equal(new Set(PROVEN_NODE_IDS).size, EXPECTED_PROVEN_NODES.length);
  assert.equal(PROVEN_NODE_CATALOGUE.length, EXPECTED_PROVEN_NODES.length);
});

test("every PROVEN node belongs to exactly one operator phase", () => {
  const catalogueIds = PROVEN_NODE_CATALOGUE.map((entry) => entry.id);
  assert.deepEqual(catalogueIds, EXPECTED_PROVEN_NODES);

  for (const entry of PROVEN_NODE_CATALOGUE) {
    assert.ok(entry.phaseId);
    assert.ok(entry.label);
    assert.ok(entry.operationKind);
  }

  assert.equal(
    Object.values(PRIMARY_TRANSFORMER_PHASE_WEIGHTS).reduce(
      (sum, weight) => sum + weight,
      0,
    ),
    100,
  );
});

test("gate policies distinguish G11 direct seal from G12 candidate promotion", () => {
  assert.equal(DIRECT_SEAL_GATE_POLICY.transformationReviewGate, "G08");
  assert.equal(DIRECT_SEAL_GATE_POLICY.postValidation.kind, "G11_DIRECT_SEAL");
  assert.equal(DIRECT_SEAL_GATE_POLICY.postValidation.gateId, "G11");
  assert.equal(
    DIRECT_SEAL_GATE_POLICY.postValidation.requiresCandidatePromotion,
    false,
  );
  assert.deepEqual(DIRECT_SEAL_GATE_POLICY.promotionGates, []);

  assert.equal(
    CANDIDATE_PROMOTION_GATE_POLICY.transformationReviewGate,
    "G08",
  );
  assert.equal(
    CANDIDATE_PROMOTION_GATE_POLICY.postValidation.kind,
    "G12_CANDIDATE_PROMOTION",
  );
  assert.equal(CANDIDATE_PROMOTION_GATE_POLICY.postValidation.gateId, "G12");
  assert.equal(
    CANDIDATE_PROMOTION_GATE_POLICY.postValidation.requiresCandidatePromotion,
    true,
  );
  assert.deepEqual(
    CANDIDATE_PROMOTION_GATE_POLICY.promotionGates,
    ["G09", "G12"],
  );
});
