/**
 * Client-side inference engine for Logistic Regression model
 * Replicates scikit-learn Pipeline (SimpleImputer + StandardScaler + LogisticRegression)
 */

export function predictRisk(rawInputs, deployedModel) {
  if (!deployedModel) {
    throw new Error('Deployed model parameters not provided');
  }

  const {
    feature_order,
    invalid_zero_features = [],
    imputation_medians = {},
    scaler_mean = [],
    scaler_scale = [],
    coef = [],
    intercept = 0,
    risk_thresholds = { low: 0.3, high: 0.6 }
  } = deployedModel;

  const imputedFeatures = [];
  const processedValues = [];
  const contributions = [];
  let logit = intercept;

  feature_order.forEach((feat, i) => {
    let rawVal = rawInputs[feat];
    let isImputed = false;

    // Check if value is missing, empty, or an invalid physiological zero
    if (
      rawVal === undefined ||
      rawVal === null ||
      rawVal === '' ||
      isNaN(Number(rawVal)) ||
      (invalid_zero_features.includes(feat) && Number(rawVal) === 0)
    ) {
      if (imputation_medians[feat] !== undefined) {
        rawVal = imputation_medians[feat];
        isImputed = true;
        imputedFeatures.push(feat);
      } else {
        rawVal = 0;
      }
    } else {
      rawVal = Number(rawVal);
    }

    processedValues.push(rawVal);

    // Standardize: z = (x - mean) / scale
    const mean = scaler_mean[i] ?? 0;
    const scale = scaler_scale[i] ?? 1;
    const z = scale !== 0 ? (rawVal - mean) / scale : 0;

    // Feature log-odds contribution: delta = coef * z
    const featureCoef = coef[i] ?? 0;
    const contribution = featureCoef * z;
    logit += contribution;

    contributions.push({
      feature: feat,
      value: rawVal,
      isImputed,
      z: Number(z.toFixed(4)),
      coef: featureCoef,
      contribution: Number(contribution.toFixed(4)),
      direction: contribution >= 0 ? 'increases risk' : 'reduces risk'
    });
  });

  // Sigmoid activation: P = 1 / (1 + exp(-logit))
  const probability = 1 / (1 + Math.exp(-logit));
  const probabilityPercent = Number((probability * 100).toFixed(1));

  // Determine risk band
  let riskBand = 'Moderate';
  let riskColor = '#f59e0b'; // amber
  if (probability < risk_thresholds.low) {
    riskBand = 'Low';
    riskColor = '#0d9488'; // teal
  } else if (probability > risk_thresholds.high) {
    riskBand = 'High';
    riskColor = '#ef4444'; // red
  }

  // Sort contributions by absolute impact for insight
  const sortedContributions = [...contributions].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  const topFactor = sortedContributions[0];
  let explanation = `Estimated diabetes risk is ${probabilityPercent}% (${riskBand} Risk). `;
  if (topFactor) {
    explanation += `The leading factor is ${topFactor.feature} (${topFactor.contribution >= 0 ? '+' : ''}${topFactor.contribution.toFixed(2)} log-odds), which ${topFactor.direction}.`;
  }

  return {
    probability,
    probabilityPercent,
    riskBand,
    riskColor,
    logit: Number(logit.toFixed(4)),
    imputedFeatures,
    processedValues,
    contributions,
    sortedContributions,
    explanation
  };
}
