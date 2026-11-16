import results from './results.json';

const deployedModel = results.deployed_model;

/**
 * Predict 30-day hospital readmission probability and compute risk attribution.
 * Uses exact scikit-learn standard scaling and logistic regression weights.
 * 
 * @param {Object} inputs - Patient clinical encounter features
 * @returns {Object} Prediction results with probability, risk level, contributions, and care pathway
 */
export function predictReadmission(inputs) {
  const { coefs, intercept, num_features, num_means, num_scales, cat_features } = deployedModel;

  let logit = intercept;
  const contributions = [];

  // 1. Process numerical features
  num_features.forEach((feature) => {
    const rawVal = parseFloat(inputs[feature] !== undefined ? inputs[feature] : num_means[feature]);
    const mean = num_means[feature];
    const scale = num_scales[feature];
    const zScore = (rawVal - mean) / scale;
    const coef = coefs[feature] || 0.0;
    const contrib = zScore * coef;

    logit += contrib;

    contributions.push({
      feature,
      label: formatFeatureLabel(feature),
      rawVal,
      type: 'numerical',
      contribution: contrib,
      impact: contrib > 0.005 ? 'increases_risk' : contrib < -0.005 ? 'reduces_risk' : 'neutral'
    });
  });

  // 2. Process categorical features (One-Hot Encoded with drop='first')
  cat_features.forEach((cat) => {
    const rawVal = String(inputs[cat] || '');
    const dummyName = `${cat}_${rawVal}`;

    // If this dummy exists in coefs (i.e. not the dropped first category)
    if (coefs[dummyName] !== undefined) {
      const coef = coefs[dummyName];
      const contrib = coef * 1.0;
      logit += contrib;

      contributions.push({
        feature: dummyName,
        label: `${formatFeatureLabel(cat)}: ${rawVal}`,
        rawVal,
        type: 'categorical',
        contribution: contrib,
        impact: contrib > 0.005 ? 'increases_risk' : contrib < -0.005 ? 'reduces_risk' : 'neutral'
      });
    }
  });

  // Sigmoid probability
  const probability = 1.0 / (1.0 + Math.exp(-logit));

  // Sort contributions by absolute magnitude for the waterfall chart
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  // Risk categorization based on CMS HRRP benchmarks
  // Population baseline rate is 8.98% (or ~18% before strict 30-day binary filtering)
  let riskLevel = 'Low Risk';
  let riskBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeColor = '#02C39A';
  let carePathway = [];

  if (probability >= 0.40) {
    riskLevel = 'High Risk';
    riskBadge = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeColor = '#E11D48';
    carePathway = [
      { priority: 'Urgent', action: 'Schedule 48-Hour Telehealth Follow-up', detail: 'Contact patient within 48 hours to reconcile discharge medications and assess glycemic stability.' },
      { priority: 'High', action: 'Home Health Transition Referral', detail: 'Assign visiting nurse for medication adherence, wound check, and vital signs monitoring.' },
      { priority: 'High', action: 'Inpatient Diabetes Educator Re-consult', detail: 'Reinforce insulin administration and hypoglycemia rescue protocol prior to physical discharge.' },
      { priority: 'Medium', action: '7-Day Primary Care In-Person Visit', detail: 'Mandatory outpatient clinic visit with comprehensive metabolic panel (CMP).' }
    ];
  } else if (probability >= 0.25) {
    riskLevel = 'Moderate Risk';
    riskBadge = 'bg-amber-50 text-amber-800 border-amber-200';
    badgeColor = '#F59E0B';
    carePathway = [
      { priority: 'Moderate', action: 'Schedule 7-Day Follow-up Visit', detail: 'Clinical assessment with outpatient endocrinologist or PCP.' },
      { priority: 'Moderate', action: 'Discharge Medication Reconciliation', detail: 'Verify patient understanding of insulin and oral agent adjustments made during stay.' },
      { priority: 'Standard', action: 'Automated 72-Hour Check-in Call', detail: 'Automated voice/SMS check for symptom exacerbation or prescription fulfillment issues.' }
    ];
  } else {
    riskLevel = 'Low Risk';
    riskBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    badgeColor = '#02C39A';
    carePathway = [
      { priority: 'Standard', action: 'Routine 14-Day Outpatient Follow-up', detail: 'Standard post-discharge follow-up with primary care physician.' },
      { priority: 'Preventative', action: 'Outpatient HbA1c Re-check in 90 Days', detail: 'Maintain quarterly glycemic surveillance as recommended by ADA clinical standards.' },
      { priority: 'Standard', action: 'Self-Monitoring Glucose Diary', detail: 'Encourage daily fasting and postprandial blood glucose tracking.' }
    ];
  }

  return {
    probability,
    percentage: (probability * 100).toFixed(1),
    logit: logit.toFixed(4),
    riskLevel,
    riskBadge,
    badgeColor,
    contributions,
    topPositiveDrivers: contributions.filter(c => c.contribution > 0).slice(0, 5),
    topProtectiveDrivers: contributions.filter(c => c.contribution < 0).slice(0, 5),
    carePathway
  };
}

function formatFeatureLabel(name) {
  const map = {
    time_in_hospital: 'Length of Stay (Days)',
    num_lab_procedures: 'Lab Procedures Count',
    num_procedures: 'Non-Lab Procedures',
    num_medications: 'Medications Administered',
    number_outpatient: 'Prior Outpatient Visits',
    number_emergency: 'Prior Emergency Visits',
    number_inpatient: 'Prior Inpatient Admissions',
    number_diagnoses: 'Diagnoses Count',
    total_prior_visits: 'Total Prior Encounters',
    has_prior_inpatient: 'History of Inpatient Stay',
    has_prior_emergency: 'History of ER Visit',
    a1c_tested: 'HbA1c Lab Performed',
    high_comorbidity: 'High Comorbidity (>=7)',
    age_cleaned: 'Age Bracket',
    gender: 'Gender',
    race: 'Race / Ethnicity',
    admission_group: 'Admission Type',
    discharge_group: 'Discharge Disposition',
    primary_diagnosis: 'Primary ICD-9 Diagnosis',
    max_glu_serum: 'Serum Glucose Test',
    A1Cresult: 'HbA1c Result Level',
    insulin: 'Insulin Regimen Change',
    change: 'Overall Med Adjustment',
    diabetesMed: 'Prescribed Diabetes Meds'
  };
  return map[name] || name.replace(/_/g, ' ');
}

export default predictReadmission;
