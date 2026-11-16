/**
 * Dynamically builds a compact plain-text Knowledge Base from results.json at runtime.
 * Never hard-coded. Grounding source for the Gemini Ask the Data assistant.
 */

export function buildKnowledgeBase(results) {
  if (!results) return '';

  const meta = results.meta || {};
  const features = results.features || [];
  const cb = results.class_balance || {};
  const split = results.split || {};
  const missing = results.missing || {};
  const stats = results.summary_stats || {};
  const corr = results.correlation || {};
  const means = results.means_by_outcome || {};
  const groupRates = results.group_rates || {};
  const models = results.models || [];
  const bestModel = results.best_model || 'Unknown';
  const exp = results.explainability || {};
  const deployed = results.deployed_model || {};

  const lines = [];

  // Project & Data Source
  lines.push('=== PROJECT OVERVIEW & GOAL ===');
  lines.push(`Title: ${meta.title || 'Diabetes Risk Prediction Dashboard'}`);
  lines.push(`Academic context: BE AI&DS Healthcare AI/ML Mini Project. Target: SDG 3 (Good Health and Well-being, Target 3.4).`);
  lines.push(`Goal: Early non-invasive diabetes risk screening support; stratifies patients into Low (<30%), Moderate (30-60%), High (>60%) risk.`);
  lines.push(`Clinical role: Academic prototype only. Not medical advice or diagnostic software.`);
  lines.push(`Dataset source: ${meta.source_name || 'Pima Indians Diabetes Database'} (OpenML ID 37 / Kaggle / UCI Machine Learning Repository).`);
  lines.push(`Cohort details: 768 female patients of Pima Indian heritage aged 21 and older living near Phoenix, Arizona.`);
  lines.push(`Dataset dimensions: ${meta.n_rows || 768} rows, ${meta.n_features || 8} clinical features, 1 binary target (Outcome: 0 = No diabetes, 1 = Diabetes).`);
  lines.push(`Class balance: Negative = ${cb.neg} (${cb.neg_pct}%), Positive = ${cb.pos} (${cb.pos_pct}%). Imbalanced ratio approx 65:35.`);
  lines.push(`Data partitioning: Stratified 80/20 train/test split (random_state=42). Train N = ${split.train_size} (${split.train_pos_pct}% positive), Test N = ${split.test_size} (${split.test_pos_pct}% positive).`);
  lines.push('');

  // Feature Definitions
  lines.push('=== CLINICAL FEATURES & UNITS ===');
  features.forEach(f => {
    lines.push(`- ${f.label} (${f.key}): ${f.description}. Unit: ${f.unit}.`);
  });
  lines.push('');

  // Data Preparation & Zeros
  lines.push('=== DATA PREPARATION & PHYSIOLOGICAL ZEROS ===');
  lines.push('Physiologically impossible zeros detected in 5 clinical variables:');
  const zeroCounts = missing.invalid_zero_counts || {};
  const medians = missing.medians || {};
  Object.keys(zeroCounts).forEach(k => {
    lines.push(`- ${k}: ${zeroCounts[k]} invalid zero values (replaced with NaN; imputed using training median = ${medians[k] ?? 'N/A'}).`);
  });
  lines.push('Imputation policy: Median imputation performed strictly inside sklearn Pipeline on training partition only to prevent data leakage.');
  lines.push('');

  // Summary Statistics
  lines.push('=== FEATURE SUMMARY STATISTICS (NON-ZERO DATA) ===');
  Object.keys(stats).forEach(k => {
    const s = stats[k];
    lines.push(`- ${k}: mean=${s.mean}, std=${s.std}, min=${s.min}, median=${s.median}, max=${s.max}`);
  });
  lines.push('');

  // Correlation & Means by Outcome
  lines.push('=== CORRELATIONS & MEANS BY OUTCOME ===');
  if (corr.features && corr.matrix) {
    const outcomeIdx = corr.features.indexOf('Outcome');
    if (outcomeIdx !== -1) {
      corr.features.forEach((feat, i) => {
        if (feat !== 'Outcome') {
          const rVal = corr.matrix[i]?.[outcomeIdx];
          lines.push(`- Correlation ${feat} with Outcome: r = ${rVal !== undefined ? rVal.toFixed(3) : 'N/A'}`);
        }
      });
    }
  }
  lines.push('Feature means conditioned on Outcome (No Diabetes vs Diabetes):');
  Object.keys(means).forEach(k => {
    const m = means[k];
    lines.push(`- ${k}: No Diabetes mean = ${m.neg}, Diabetes mean = ${m.pos}`);
  });
  lines.push('');

  // Group-wise Diabetes Rates
  lines.push('=== GROUP-WISE DIABETES RATES ===');
  Object.keys(groupRates).forEach(cat => {
    const items = groupRates[cat] || [];
    const formatted = items.map(it => `${it.band} (n=${it.n}, rate=${it.positive_rate}%)`).join('; ');
    lines.push(`- ${cat}: ${formatted}`);
  });
  lines.push('');

  // Model Evaluation & Comparison
  lines.push('=== MODEL EVALUATION & CROSS-VALIDATION (TEST SET N=154) ===');
  lines.push(`Best overall model by test ROC-AUC (tie-break by Recall): ${bestModel}`);
  models.forEach(m => {
    const cm = m.confusion_matrix || [[0, 0], [0, 0]];
    const tn = cm[0]?.[0] ?? 0;
    const fp = cm[0]?.[1] ?? 0;
    const fn = cm[1]?.[0] ?? 0;
    const tp = cm[1]?.[1] ?? 0;
    lines.push(`- Model: ${m.name}`);
    lines.push(`  5-Fold CV ROC-AUC: ${m.cv_roc_auc_mean} +/- ${m.cv_roc_auc_std}`);
    lines.push(`  Test Accuracy: ${(m.accuracy * 100).toFixed(2)}%, Precision: ${(m.precision * 100).toFixed(2)}%, Recall: ${(m.recall * 100).toFixed(2)}%, F1-Score: ${(m.f1 * 100).toFixed(2)}%, Test ROC-AUC: ${m.roc_auc.toFixed(4)}`);
    lines.push(`  Confusion Matrix: True Negatives (TN) = ${tn}, False Positives (FP) = ${fp}, False Negatives (FN) = ${fn}, True Positives (TP) = ${tp}`);
  });
  lines.push('Clinical metric note: Recall is prioritized in screening because missing a diabetic case (False Negative) delays crucial intervention. A False Positive is verified via follow-up clinical tests.');
  lines.push('');

  // Explainability
  lines.push('=== MODEL EXPLAINABILITY & FEATURE IMPORTANCE ===');
  const lrCoefs = exp.lr_coefficients || {};
  lines.push('Logistic Regression Standardized Coefficients:');
  Object.keys(lrCoefs).forEach(k => {
    lines.push(`- ${k}: ${lrCoefs[k]}`);
  });
  const permImp = exp.permutation_importance || {};
  lines.push(`Permutation Importance on Test Set (${bestModel}):`);
  Object.keys(permImp).forEach(k => {
    lines.push(`- ${k}: drop in ROC-AUC = ${permImp[k].mean} +/- ${permImp[k].std}`);
  });
  const rfImp = exp.rf_importance || {};
  lines.push('Random Forest Gini Impurity Importances:');
  Object.keys(rfImp).forEach(k => {
    lines.push(`- ${k}: ${rfImp[k]}`);
  });
  lines.push('Top 3 overall predictors: Glucose (strongest positive driver), BMI (adiposity and insulin resistance), and Age / DiabetesPedigreeFunction.');
  lines.push('');

  // Deployed Model
  lines.push('=== DEPLOYED MODEL IN WEBSITE ===');
  lines.push(`Model deployed: ${deployed.name || 'Logistic Regression'}`);
  lines.push('Rationale for deployment: Chosen for clinical interpretability, exact per-feature additive log-odds decomposition (coef * z), zero-latency client-side execution, and absence of black-box uncertainty.');
  lines.push(`Intercept: ${deployed.intercept}`);
  lines.push(`Risk Thresholds: Low risk < ${deployed.risk_thresholds?.low ?? 0.3}, Moderate risk ${deployed.risk_thresholds?.low ?? 0.3} - ${deployed.risk_thresholds?.high ?? 0.6}, High risk > ${deployed.risk_thresholds?.high ?? 0.6}`);
  lines.push('');

  // Limitations, Bias & Ethics
  lines.push('=== LIMITATIONS, BIAS & ETHICAL CONSIDERATIONS ===');
  lines.push('- Demographic Bias: Dataset comprises solely female patients of Pima Indian descent aged 21+. Results do not directly extrapolate to males, children, or other racial/ethnic demographics without clinical recalibration.');
  lines.push('- Sample Size: 768 total records from a single historical geographic cohort.');
  lines.push('- Missing Physiological Values: High proportion of imputed entries in Insulin (48.7%) and Skin Thickness (29.6%).');
  lines.push('- No Clinical Validation: Not evaluated in live randomized clinical trials or integrated hospital EHR systems.');
  lines.push('- Screening vs Diagnosis: Designed solely as a non-invasive risk triage tool, never as a diagnostic substitute for venous blood draws or physician examination.');
  lines.push('- AI Assistant Scope: Gemini assistant has access only to this summary knowledge base, NOT raw row-level records.');

  return lines.join('\n');
}
