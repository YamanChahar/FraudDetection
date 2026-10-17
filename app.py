"""FraudLens — Fraud Detection & Risk Assessment System Dashboard.

A production-grade, interactive fintech risk monitoring and scoring dashboard
integrated with the trained champion Random Forest pipeline and risk engine.
"""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import streamlit as st

from src import config
from src.predict import FraudPredictor, validate_inference_features
from src.risk_engine import RiskThresholds, assess_risk

# -----------------------------------------------------------------------------
# Streamlit Application Configuration
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="FraudLens — Fraud & Risk Assessment System",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Styling Enhancements
st.markdown(
    """
    <style>
    /* Metric Card Styling */
    .metric-card {
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px 20px;
        margin-bottom: 12px;
    }
    .metric-label {
        font-size: 0.82rem;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
    }
    .metric-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: #F8FAFC;
        margin-top: 4px;
    }
    .metric-subtext {
        font-size: 0.78rem;
        color: #0284C7;
        margin-top: 4px;
    }

    /* Risk Badges */
    .badge-low {
        background-color: rgba(16, 185, 129, 0.15);
        color: #10B981;
        border: 1px solid #10B981;
        border-radius: 6px;
        padding: 4px 12px;
        font-weight: 700;
        display: inline-block;
    }
    .badge-medium {
        background-color: rgba(245, 158, 11, 0.15);
        color: #F59E0B;
        border: 1px solid #F59E0B;
        border-radius: 6px;
        padding: 4px 12px;
        font-weight: 700;
        display: inline-block;
    }
    .badge-high {
        background-color: rgba(239, 68, 68, 0.15);
        color: #EF4444;
        border: 1px solid #EF4444;
        border-radius: 6px;
        padding: 4px 12px;
        font-weight: 700;
        display: inline-block;
    }
    .disclaimer-box {
        background-color: #0F172A;
        border-left: 4px solid #0284C7;
        padding: 12px 16px;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #94A3B8;
        margin-top: 16px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# -----------------------------------------------------------------------------
# Cached Resource Loaders
# -----------------------------------------------------------------------------
@st.cache_resource(show_spinner=False)
def get_cached_predictor() -> Optional[FraudPredictor]:
    """Load and cache the trained champion model pipeline."""
    try:
        return FraudPredictor(config.BEST_MODEL_PATH)
    except FileNotFoundError:
        return None
    except Exception as e:
        st.error(f"Error loading model artifact: {e}")
        return None


@st.cache_data(show_spinner=False)
def load_model_comparison_report() -> Optional[Dict[str, Any]]:
    """Load machine-readable evaluation report from Phase 5."""
    report_path = config.REPORTS_DIR / "model_comparison.json"
    if report_path.exists():
        with open(report_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


# -----------------------------------------------------------------------------
# Sidebar Navigation & Operational Controls
# -----------------------------------------------------------------------------
st.sidebar.markdown("## 🛡️ FraudLens AI")
st.sidebar.markdown(
    "<span style='font-size: 0.82rem; color: #94A3B8;'>Enterprise Risk Assessment Platform</span>",
    unsafe_allow_html=True,
)
st.sidebar.markdown("---")

navigation_selection = st.sidebar.radio(
    "Navigation Menu",
    [
        "📊 Executive Overview",
        "🔍 Single Transaction Scoring",
        "📁 Batch CSV Analysis",
        "📈 Model Performance & Benchmarks",
        "🔎 Transaction Explorer",
        "ℹ️ Governance & Limitations",
    ],
    index=0,
)

st.sidebar.markdown("---")
st.sidebar.markdown("### ⚙️ Risk Policy Engine")
st.sidebar.caption("Configure operational decision thresholds:")

low_thresh = st.sidebar.slider(
    "Low Risk Threshold (p < T₁)",
    min_value=0.05,
    max_value=0.45,
    value=config.DEFAULT_LOW_RISK_THRESHOLD,
    step=0.05,
    help="Transactions below this probability receive Automated Approval.",
)

high_thresh = st.sidebar.slider(
    "High Risk Threshold (p ≥ T₂)",
    min_value=0.50,
    max_value=0.95,
    value=config.DEFAULT_HIGH_RISK_THRESHOLD,
    step=0.05,
    help="Transactions at or above this probability are flagged for Immediate Interception.",
)

active_thresholds = RiskThresholds(low_threshold=low_thresh, high_threshold=high_thresh)

# Sidebar System Health Status
st.sidebar.markdown("---")
st.sidebar.markdown("### 🔌 System Health")
predictor = get_cached_predictor()

if predictor is not None:
    st.sidebar.success(f"Model Active: {predictor.model_name}")
else:
    st.sidebar.error("Model Offline: Artifact Missing")

if config.DATASET_PATH.exists():
    st.sidebar.info("Dataset Connected: creditcard.csv")
else:
    st.sidebar.warning("Dataset Not Detected")

st.sidebar.caption("Environment: Python 3.13.1 | Pipeline: Scikit-learn & RobustScaler")


# -----------------------------------------------------------------------------
# SECTION A: Executive Overview
# -----------------------------------------------------------------------------
if navigation_selection == "📊 Executive Overview":
    st.title("📊 Executive Overview & Risk Posture")
    st.markdown(
        "Real-time operational summary of transaction volume, fraud interception capability, "
        "and risk tier distribution on the verified ULB financial benchmark."
    )

    report_data = load_model_comparison_report()

    if report_data is not None:
        best_model_id = report_data["selected_model"]["id"]
        model_info = report_data["models"][best_model_id]
        metrics = model_info["metrics"]
        cm = model_info["confusion_matrix"]
        split = report_data["split_summary"]["test"]

        # 4 Primary KPI Metric Cards
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Held-Out Test Volume</div>
                    <div class="metric-value">{split['rows']:,}</div>
                    <div class="metric-subtext">Isolated Unseen Split</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with col2:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Fraud Catch Rate (Recall)</div>
                    <div class="metric-value">{metrics['recall']*100:.1f}%</div>
                    <div class="metric-subtext">{cm['true_positives']} of {cm['true_positives'] + cm['false_negatives']} Frauds Intercepted</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with col3:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Precision (Alarm Accuracy)</div>
                    <div class="metric-value">{metrics['precision']*100:.1f}%</div>
                    <div class="metric-subtext">Only {cm['false_positives']} False Alarms across {split['rows']:,}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with col4:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Area Under PR Curve</div>
                    <div class="metric-value">{metrics['average_precision_pr_auc']:.4f}</div>
                    <div class="metric-subtext">Champion Benchmark (+12.9 pts vs Baseline)</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        st.markdown("---")

        # Two Column Layout: Confusion Matrix & Risk Distribution
        c_left, c_right = st.columns([1, 1])

        with c_left:
            st.subheader("🎯 Test Set Confusion Matrix")
            cm_df = pd.DataFrame(
                [
                    [f"{cm['true_negatives']:,} (TN)", f"{cm['false_positives']:,} (FP)"],
                    [f"{cm['false_negatives']:,} (FN)", f"{cm['true_positives']:,} (TP)"],
                ],
                index=["Actual Legitimate (0)", "Actual Fraudulent (1)"],
                columns=["Predicted Legitimate", "Predicted Fraudulent"],
            )
            st.table(cm_df)
            st.caption(
                f"False Positive Rate: **{model_info['operational_rates']['false_positive_rate']*100:.2f}%** | "
                f"Missed Fraud Rate: **{model_info['operational_rates']['false_negative_rate']*100:.2f}%**"
            )

        with c_right:
            st.subheader("📈 Operational Action Distribution")
            tier_df = pd.DataFrame(
                {
                    "Risk Tier": ["Low Risk (Auto-Approve)", "Medium Risk (Review)", "High Risk (Interception)"],
                    "Transactions": [cm["true_negatives"], cm["false_positives"] + cm["false_negatives"], cm["true_positives"]],
                }
            )
            st.bar_chart(tier_df.set_index("Risk Tier"), color="#0284C7")
            st.caption("Distribution of transaction verdicts under active operational policy.")

    else:
        st.info("Evaluation metrics report not found. Please train models in Phase 5 to populate overview KPIs.")

    st.markdown(
        """
        <div class="disclaimer-box">
            <strong>Regulatory & Governance Notice:</strong>
            FraudLens is an engineering portfolio prototype developed for statistical risk assessment.
            It does not connect to SWIFT, Visa, or banking clearance networks, and does not execute real-money holds.
        </div>
        """,
        unsafe_allow_html=True,
    )


# -----------------------------------------------------------------------------
# SECTION B: Single Transaction Analysis
# -----------------------------------------------------------------------------
elif navigation_selection == "🔍 Single Transaction Scoring":
    st.title("🔍 Single Transaction Risk Scoring")
    st.markdown(
        "Evaluate an individual payment transaction across all 30 canonical features "
        "to estimate fraud probability and generate operational handling recommendations."
    )

    if predictor is None:
        st.error("Model artifact offline. Please train and save `models/best_model.joblib` to enable scoring.")
    else:
        # Quick Presets for User Convenience
        st.markdown("#### ⚡ Quick-Fill Presets from Verified Real Dataset")
        preset_choice = st.radio(
            "Select a real sample transaction:",
            ["Custom Manual Entry", "Load Known Legitimate Transaction (Sample #1)", "Load Known Fraudulent Transaction (Sample #2)"],
            horizontal=True,
        )

        # Default Values
        default_time = 1000.0
        default_amount = 75.00
        default_pca = {col: 0.0 for col in config.PCA_FEATURES}

        if preset_choice == "Load Known Legitimate Transaction (Sample #1)":
            default_time = 0.0
            default_amount = 149.62
            default_pca = {
                "V1": -1.3598, "V2": -0.0728, "V3": 2.5363, "V4": 1.3782,
                "V5": -0.3383, "V6": 0.4624, "V7": 0.2396, "V8": 0.0987,
                "V9": 0.3638, "V10": 0.0908, "V11": -0.5516, "V12": -0.6178,
                "V13": -0.9914, "V14": -0.3112, "V15": 1.4682, "V16": -0.4704,
                "V17": 0.2080, "V18": 0.0258, "V19": 0.4040, "V20": 0.2514,
                "V21": -0.0183, "V22": 0.2778, "V23": -0.1105, "V24": 0.0669,
                "V25": 0.1285, "V26": -0.1891, "V27": 0.1336, "V28": -0.0211,
            }
        elif preset_choice == "Load Known Fraudulent Transaction (Sample #2)":
            default_time = 406.0
            default_amount = 0.00
            default_pca = {
                "V1": -2.3122, "V2": 1.9520, "V3": -1.6099, "V4": 3.9979,
                "V5": -0.5222, "V6": -1.4265, "V7": -2.5374, "V8": 1.3917,
                "V9": -2.7701, "V10": -2.7723, "V11": 3.2020, "V12": -2.8999,
                "V13": -0.5952, "V14": -4.2893, "V15": 0.3897, "V16": -1.1407,
                "V17": -2.8301, "V18": -0.0168, "V19": 0.4170, "V20": 0.1269,
                "V21": 0.5172, "V22": -0.0350, "V23": -0.4652, "V24": 0.3202,
                "V25": 0.0441, "V26": 0.1778, "V27": 0.2611, "V28": -0.1433,
            }

        with st.form("single_transaction_form"):
            st.markdown("##### 1. Primary Transaction Attributes")
            f_col1, f_col2 = st.columns(2)
            with f_col1:
                input_amount = st.number_input(
                    "Transaction Amount ($)",
                    min_value=0.0,
                    max_value=100000.0,
                    value=float(default_amount),
                    step=5.0,
                    help="Transaction amount in currency units.",
                )
            with f_col2:
                input_time = st.number_input(
                    "Elapsed Time (Seconds)",
                    min_value=0.0,
                    max_value=200000.0,
                    value=float(default_time),
                    step=10.0,
                    help="Seconds elapsed since recording epoch (0 to ~172,800 sec).",
                )

            st.markdown("##### 2. Anonymized PCA Features (V1 to V28)")
            st.caption("PCA features derived from cardholder behavioral signals. Standard scale is approximately [-5.0, 5.0].")

            with st.expander("Expand to view / edit PCA Features V1–V28", expanded=(preset_choice == "Custom Manual Entry")):
                pca_inputs = {}
                cols = st.columns(4)
                for i in range(1, 29):
                    c_name = f"V{i}"
                    c_idx = (i - 1) % 4
                    with cols[c_idx]:
                        pca_inputs[c_name] = st.number_input(
                            c_name,
                            value=float(default_pca.get(c_name, 0.0)),
                            format="%.4f",
                            key=f"input_{c_name}",
                        )

            submit_button = st.form_submit_button("🛡️ Score Transaction Risk", use_container_width=True)

        if submit_button:
            # Construct feature dictionary in canonical order
            tx_data = {"Time": input_time, **pca_inputs, "Amount": input_amount}

            try:
                res = predictor.predict_single(tx_data, thresholds=active_thresholds)

                st.markdown("---")
                st.subheader("📋 Decision & Risk Verdict")

                # Metric Cards for Output
                o_col1, o_col2, o_col3 = st.columns(3)

                prob_val = res["fraud_probability"]
                score_val = res["risk_score"]
                cat_val = res["risk_category"]

                badge_class = "badge-low" if cat_val == "Low Risk" else ("badge-medium" if cat_val == "Medium Risk" else "badge-high")

                with o_col1:
                    st.metric("Estimated Fraud Probability", f"{prob_val * 100:.2f}%")
                with o_col2:
                    st.metric("Risk Score", f"{score_val} / 100")
                with o_col3:
                    st.markdown("<div style='margin-top: 10px;'>", unsafe_allow_html=True)
                    st.markdown(f"<span class='{badge_class}'>{cat_val.upper()}</span>", unsafe_allow_html=True)
                    st.markdown("</div>", unsafe_allow_html=True)

                st.info(f"**Operational Policy**: {res['operational_recommendation']}")
                st.caption(
                    f"Scored by **{res['model_name']}** under active thresholds "
                    f"(Low < {active_thresholds.low_threshold:.2f}, High ≥ {active_thresholds.high_threshold:.2f})."
                )

            except Exception as e:
                st.error(f"Inference Error: {e}")


# -----------------------------------------------------------------------------
# SECTION C: Batch Transaction Analysis
# -----------------------------------------------------------------------------
elif navigation_selection == "📁 Batch CSV Analysis":
    st.title("📁 Batch Transaction Risk Analysis")
    st.markdown(
        "Upload a batch CSV file to execute high-throughput risk scoring, "
        "audit risk categories, and export enriched fraud assessments."
    )

    if predictor is None:
        st.error("Model artifact offline. Please train `models/best_model.joblib` first.")
    else:
        # Sample CSV download button
        sample_csv_path = config.DATA_DIR / "sample_batch_transactions.csv"
        if sample_csv_path.exists():
            with open(sample_csv_path, "rb") as f:
                st.download_button(
                    label="📥 Download Valid Sample Batch CSV (10 Transactions)",
                    data=f,
                    file_name="sample_batch_transactions.csv",
                    mime="text/csv",
                    help="Click to download a verified CSV file formatted with all 30 required columns.",
                )

        uploaded_file = st.file_uploader(
            "Upload Batch CSV file:",
            type=["csv"],
            help="File must contain Time, V1-V28, and Amount columns.",
        )

        if uploaded_file is not None:
            try:
                batch_df = pd.read_csv(uploaded_file)
                st.success(f"File uploaded successfully! Loaded {len(batch_df):,} rows.")

                # Validate columns
                present_cols = set(batch_df.columns)
                missing = [c for c in config.FEATURE_COLUMNS if c not in present_cols]

                if missing:
                    st.error(f"CSV Schema Error: Missing required column(s): {missing}")
                else:
                    with st.spinner("Executing batch risk scoring pipeline..."):
                        scored_df = predictor.predict_batch(
                            batch_df,
                            thresholds=active_thresholds,
                            include_input_features=True,
                        )

                    # Batch Summary KPIs
                    total_count = len(scored_df)
                    low_count = (scored_df["risk_category"] == "Low Risk").sum()
                    med_count = (scored_df["risk_category"] == "Medium Risk").sum()
                    high_count = (scored_df["risk_category"] == "High Risk").sum()

                    b_col1, b_col2, b_col3, b_col4 = st.columns(4)
                    b_col1.metric("Total Records Scored", f"{total_count:,}")
                    b_col2.metric("Low Risk (Approved)", f"{low_count:,}", f"{low_count/total_count*100:.1f}%")
                    b_col3.metric("Medium Risk (Review)", f"{med_count:,}", f"{med_count/total_count*100:.1f}%")
                    b_col4.metric("High Risk (Blocked)", f"{high_count:,}", f"{high_count/total_count*100:.1f}%")

                    st.markdown("---")
                    st.subheader("🔍 Scored Results Explorer")

                    # Category Filter
                    filter_choice = st.selectbox(
                        "Filter Results by Risk Category:",
                        ["All Transactions", "High Risk Only", "Medium Risk Only", "Low Risk Only"],
                    )

                    filtered_view = scored_df
                    if filter_choice == "High Risk Only":
                        filtered_view = scored_df[scored_df["risk_category"] == "High Risk"]
                    elif filter_choice == "Medium Risk Only":
                        filtered_view = scored_df[scored_df["risk_category"] == "Medium Risk"]
                    elif filter_choice == "Low Risk Only":
                        filtered_view = scored_df[scored_df["risk_category"] == "Low Risk"]

                    display_cols = [
                        "fraud_probability",
                        "risk_score",
                        "risk_category",
                        "Amount",
                        "Time",
                        "operational_recommendation",
                    ]
                    st.dataframe(filtered_view[display_cols], use_container_width=True)

                    # Export button
                    csv_buffer = io.StringIO()
                    scored_df.to_csv(csv_buffer, index=False)
                    st.download_button(
                        label="💾 Export Enriched Predictions CSV",
                        data=csv_buffer.getvalue(),
                        file_name="fraudlens_scored_batch.csv",
                        mime="text/csv",
                    )

            except Exception as e:
                st.error(f"Batch Processing Error: {e}")


# -----------------------------------------------------------------------------
# SECTION D: Model Performance & Benchmarks
# -----------------------------------------------------------------------------
elif navigation_selection == "📈 Model Performance & Benchmarks":
    st.title("📈 Model Performance & Cross-Validation Benchmarks")
    st.markdown(
        "Empirical evaluation results across all candidate architectures evaluated during Phase 5. "
        "All metrics reflect actual execution on the isolated 56,962 held-out test split."
    )

    report_data = load_model_comparison_report()

    if report_data is not None:
        models_dict = report_data["models"]

        st.subheader("1. Comprehensive Model Comparison Matrix")

        rows = []
        for m_id, m_data in models_dict.items():
            met = m_data["metrics"]
            cm = m_data["confusion_matrix"]
            cv = m_data["cv_performance"]
            rows.append(
                {
                    "Model": m_data["model_name"],
                    "PR-AUC (Test)": met["average_precision_pr_auc"],
                    "CV PR-AUC (5-Fold)": f"{cv['cv_pr_auc_mean']} ± {cv['cv_pr_auc_std']}",
                    "Recall (Test)": f"{met['recall']*100:.2f}%",
                    "Precision (Test)": f"{met['precision']*100:.2f}%",
                    "F1-Score": met["f1_score"],
                    "ROC-AUC": met["roc_auc"],
                    "False Positives": cm["false_positives"],
                    "Missed Frauds": cm["false_negatives"],
                    "Train Time": f"{m_data['training_time_seconds']}s",
                }
            )

        st.dataframe(pd.DataFrame(rows).set_index("Model"), use_container_width=True)

        st.markdown("---")

        c_left, c_right = st.columns([1, 1])

        with c_left:
            st.subheader("2. Precision-Recall Curves")
            pr_img_path = config.REPORTS_DIR / "precision_recall_curves.png"
            if pr_img_path.exists():
                st.image(str(pr_img_path), caption="PR curves illustrating precision retention across recall tiers.")
            else:
                st.info("PR curve plot not found in reports directory.")

        with c_right:
            st.subheader("3. Architecture Trade-Off Analysis")
            st.markdown(
                """
                - **Random Forest (Champion)**: Delivers highest overall PR-AUC (**0.8462**), cutting false alarms by **97.7%** (from 1,388 down to 32) while catching 83 of 98 frauds.
                - **Logistic Regression**: Linear boundary achieves high recall (91.8%), but produces massive alert volume (1,388 false positives), depressing precision to 6.1%.
                - **XGBoost**: Highest precision (90.5%), but misses 22 frauds (77.5% recall).
                """
            )

    else:
        st.info("Model comparison report not found. Please train models in Phase 5 to view benchmarks.")


# -----------------------------------------------------------------------------
# SECTION E: Transaction Explorer
# -----------------------------------------------------------------------------
elif navigation_selection == "🔎 Transaction Explorer":
    st.title("🔎 Transaction Explorer & Audit Log")
    st.markdown(
        "Inspect, filter, and audit individual transactions from the connected dataset "
        "or score ad-hoc subsets with real-time risk classification."
    )

    if not config.DATASET_PATH.exists():
        st.warning("Dataset `creditcard.csv` not found in `data/`. Place the dataset to enable browsing.")
    elif predictor is None:
        st.error("Model artifact offline. Please train `models/best_model.joblib` first.")
    else:
        @st.cache_data(show_spinner=False)
        def get_explorer_slice(sample_size: int = 500) -> pd.DataFrame:
            df = pd.read_csv(config.DATASET_PATH, nrows=sample_size)
            return df

        df_slice = get_explorer_slice(500)

        t_col1, t_col2, t_col3 = st.columns(3)
        with t_col1:
            class_filter = st.selectbox("Ground Truth Label Filter:", ["All Transactions", "Legitimate (Class 0)", "Fraudulent (Class 1)"])
        with t_col2:
            min_amt, max_amt = st.slider("Amount Filter ($):", 0.0, 2000.0, (0.0, 1000.0), step=25.0)
        with t_col3:
            max_rows = st.number_input("Display Limit:", min_value=10, max_value=200, value=25, step=10)

        # Apply filtering
        filtered_df = df_slice[df_slice["Amount"].between(min_amt, max_amt)]
        if class_filter == "Legitimate (Class 0)":
            filtered_df = filtered_df[filtered_df["Class"] == 0]
        elif class_filter == "Fraudulent (Class 1)":
            filtered_df = filtered_df[filtered_df["Class"] == 1]

        filtered_subset = filtered_df.head(int(max_rows))

        st.markdown(f"**Showing {len(filtered_subset)} records matching criteria:**")

        if not filtered_subset.empty:
            feature_only_df = filtered_subset[config.FEATURE_COLUMNS]
            predictions = predictor.predict_batch(feature_only_df, thresholds=active_thresholds)

            # Join for display
            combined_display = pd.concat(
                [
                    filtered_subset[["Class", "Amount", "Time"]],
                    predictions[["fraud_probability", "risk_score", "risk_category"]],
                ],
                axis=1,
            )

            st.dataframe(combined_display, use_container_width=True)
            st.caption("Note: 'Class' represents historical ground truth; 'risk_category' is model prediction.")


# -----------------------------------------------------------------------------
# SECTION F: Model Governance & Limitations
# -----------------------------------------------------------------------------
elif navigation_selection == "ℹ️ Governance & Limitations":
    st.title("ℹ️ Model Governance & System Limitations")
    st.markdown(
        "Documentation of model architecture, dataset provenance, calibration characteristics, "
        "and critical financial risk boundaries."
    )

    st.subheader("1. Active Champion Architecture")
    st.markdown(
        """
        - **Algorithm**: `RandomForestClassifier` (100 estimators, max depth 12, min samples leaf 2)
        - **Preprocessing**: `RobustScaler` applied to `Time` and `Amount` (resisting outlier skew); PCA features `V1`–`V28` passed through untouched.
        - **Class Balancing**: Balanced bootstrap class weighting ($\approx 577\times$ loss weight).
        - **Artifact Location**: `models/best_model.joblib`
        """
    )

    st.subheader("2. Dataset Provenance & Known Constraints")
    st.markdown(
        """
        - **Source**: Machine Learning Group at Université Libre de Bruxelles (ULB), September 2013 credit card transactions.
        - **Anonymization**: Features `V1` through `V28` are anonymous principal components from PCA. Feature names and raw transaction semantics are obscured by design.
        - **Class Imbalance**: Fraud represents only **0.1727%** of total transaction volume.
        - **Time Horizon**: Covers a 48-hour recording window, limiting seasonal or cross-month temporal generalization.
        """
    )

    st.subheader("3. Probability Calibration Notice")
    st.markdown(
        """
        - Predicted probabilities represent **tree vote proportions** under balanced class reweighting.
        - While optimal for **ranking** (PR-AUC 0.8462), raw tree scores under class reweighting are artificially shifted upward compared to empirical base rates (~0.17%).
        - Outputs should be interpreted as **relative risk scores (0–100)** rather than exact frequentist probabilities of fraud.
        """
    )

    st.markdown(
        """
        <div class="disclaimer-box">
            <strong>Formal Banking Regulatory Disclaimer:</strong>
            This software is an educational prototype developed for machine learning research and portfolio demonstration.
            It is NOT certified under PCI-DSS, SOC 2, or financial regulatory frameworks, and must not be used to authorize, decline, or process live financial transactions.
        </div>
        """,
        unsafe_allow_html=True,
    )
