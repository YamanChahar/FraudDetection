import pytest
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from app.core.preprocessing import FEATURE_NAMES, build_preprocessor, TransactionFeatureValidator
from app.core.shap_explainer import FraudShapExplainer
from app.core.model_manager import model_manager

def test_feature_names_order_and_alignment():
    """Verify that build_preprocessor preserves exact FEATURE_NAMES order."""
    preprocessor = build_preprocessor()
    validator = TransactionFeatureValidator(FEATURE_NAMES)
    
    # Create sample dictionary
    sample = {feat: float(i + 1) for i, feat in enumerate(FEATURE_NAMES)}
    df = validator.transform(sample)
    
    # Fit & transform
    X_trans = preprocessor.fit_transform(df)
    
    # Array shape must be (1, 30)
    assert X_trans.shape == (1, 30)
    assert len(FEATURE_NAMES) == 30
    assert FEATURE_NAMES[0] == "Time"
    assert FEATURE_NAMES[-1] == "Amount"
    assert [f"V{i}" for i in range(1, 29)] == FEATURE_NAMES[1:29]


def test_shap_explainer_linear_and_tree_models():
    """Verify FraudShapExplainer works seamlessly for both Linear and Tree-based models."""
    np.random.seed(42)
    X_synth = np.random.normal(0, 1.0, size=(50, 30))
    y_synth = (X_synth[:, 1] + X_synth[:, 14] > 0.5).astype(int)

    # 1. Test Linear Model (Logistic Regression)
    linear_model = LogisticRegression(max_iter=200)
    linear_model.fit(X_synth, y_synth)

    linear_explainer = FraudShapExplainer(
        model=linear_model,
        background_data=X_synth[:20],
        feature_names=FEATURE_NAMES,
    )

    test_row = X_synth[0]
    raw_feats = {f: float(test_row[i]) for i, f in enumerate(FEATURE_NAMES)}
    res_linear = linear_explainer.explain_instance(test_row, raw_feats, 0.75)

    assert "base_value" in res_linear
    assert "top_contributing_features" in res_linear
    assert len(res_linear["all_contributions"]) == 30
    assert "disclaimer" in res_linear
    assert "not constitute proof of fraud" in res_linear["disclaimer"]

    # 2. Test Tree-based Model (Random Forest)
    tree_model = RandomForestClassifier(n_estimators=10, max_depth=3, random_state=42)
    tree_model.fit(X_synth, y_synth)

    tree_explainer = FraudShapExplainer(
        model=tree_model,
        background_data=X_synth[:20],
        feature_names=FEATURE_NAMES,
    )

    res_tree = tree_explainer.explain_instance(test_row, raw_feats, 0.85)

    assert "base_value" in res_tree
    assert "top_contributing_features" in res_tree
    assert len(res_tree["all_contributions"]) == 30
    assert "disclaimer" in res_tree


def test_shap_directional_interpretation():
    """Verify that positive SHAP values increase risk and negative decrease risk."""
    model_manager.load_model()
    # High risk anomaly sample
    features = {f: 0.0 for f in FEATURE_NAMES}
    features["Amount"] = 999.0
    features["V14"] = -4.5
    features["V4"] = 3.8

    result = model_manager.predict_single(features)
    shap_data = result["shap_explanation"]

    assert "top_contributing_features" in shap_data
    top_factors = shap_data["top_contributing_features"]
    assert len(top_factors) <= 8

    for factor in top_factors:
        assert factor["direction"] in ["INCREASES_RISK", "DECREASES_RISK"]
        if factor["shap_value"] > 0:
            assert factor["direction"] == "INCREASES_RISK"
        else:
            assert factor["direction"] == "DECREASES_RISK"
        assert factor["absolute_impact"] == abs(factor["shap_value"])
