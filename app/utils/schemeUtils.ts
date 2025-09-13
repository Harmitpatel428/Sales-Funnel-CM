// Utility functions for scheme formatting and descriptions

export interface SchemeDescription {
  title: string;
  shortName: string;
  description: string[];
}

// Complete scheme descriptions matching the consultant's sample PDF
export const SCHEME_DESCRIPTIONS: { [key: string]: SchemeDescription } = {
  'Interest Subsidy': {
    title: 'Interest Subsidy',
    shortName: 'Interest Subsidy',
    description: [
      'Interest subsidy @ 6% per annum on term loan sanctioned by Bank/Financial Institution.',
      'Maximum subsidy amount: ₹25 Lakhs per unit.',
      'Subsidy will be provided for a maximum period of 5 years from the date of disbursement of term loan.',
      'The subsidy will be credited directly to the loan account of the beneficiary.'
    ]
  },
  'Power Connection Charges': {
    title: 'Power Connection Charges (PCC)',
    shortName: 'Power Connection Charges benefits (PCC)',
    description: [
      'Reimbursement of 100% of the power connection charges paid to DISCOM.',
      'Maximum reimbursement amount: ₹10 Lakhs per unit.',
      'Applicable for new power connections of 11 KV and above.',
      'Reimbursement will be provided after successful connection and payment of charges.'
    ]
  },
  'Electric Duty Exemption': {
    title: 'Electric Duty Exemption (EDE)',
    shortName: 'Electricity Duty Exemption (EDE)',
    description: [
      'Exemption from payment of electricity duty for a period of 5 years.',
      'Applicable for new industrial units with power connection of 11 KV and above.',
      'Exemption will be provided from the date of commencement of commercial production.',
      'Maximum exemption limit: ₹50 Lakhs per unit.'
    ]
  },
  'SGST Subsidy': {
    title: 'SGST Subsidy',
    shortName: 'SGST Subsidy',
    description: [
      'Reimbursement of State Goods and Services Tax (SGST) paid on capital investment.',
      'Maximum reimbursement amount: ₹15 Lakhs per unit.',
      'Applicable for new industrial units with minimum investment of ₹50 Lakhs.',
      'Reimbursement will be provided in 5 equal annual installments.'
    ]
  },
  'Rent': {
    title: 'Rent Subsidy',
    shortName: 'Rent Subsidy',
    description: [
      'Rent subsidy @ ₹50 per sq. ft. per month for industrial plots.',
      'Maximum subsidy period: 5 years from the date of allotment.',
      'Applicable for new industrial units in GIDC areas.',
      'Subsidy will be credited directly to the unit\'s bank account.'
    ]
  },
  'Solar Subsidy': {
    title: 'Solar Subsidy',
    shortName: 'Solar Subsidy',
    description: [
      'Subsidy for installation of solar power plants.',
      'Maximum subsidy amount: ₹2 Lakhs per KW of installed capacity.',
      'Applicable for solar power plants of minimum 1 KW capacity.',
      'Subsidy will be provided after successful commissioning and grid connection.'
    ]
  }
};

/**
 * Formats the subject line based on selected schemes and policy
 * @param schemes Array of selected scheme names
 * @param policy Selected policy (optional)
 * @returns Formatted subject line string
 */
export function formatSubjectLine(schemes: string[], policy?: string): string {
  const policyText = policy ? `under the ${policy}` : 'under the Atmanirbhar Gujarat Scheme 2022';
  
  if (schemes.length === 0) {
    return `Consulting fees for government subsidy work for government subsidy schemes for your new firm ${policyText}.`;
  }

  if (schemes.length === 1) {
    const schemeName = SCHEME_DESCRIPTIONS[schemes[0]!]?.shortName || schemes[0]!;
    return `Consulting fees for government subsidy work for ${schemeName} for your new firm ${policyText}.`;
  }

  if (schemes.length === 2) {
    const scheme1 = SCHEME_DESCRIPTIONS[schemes[0]!]?.shortName || schemes[0]!;
    const scheme2 = SCHEME_DESCRIPTIONS[schemes[1]!]?.shortName || schemes[1]!;
    return `Consulting fees for government subsidy work for ${scheme1} & ${scheme2} for your new firm ${policyText}.`;
  }

  // 3 or more schemes
  const formattedSchemes = schemes.map(scheme => {
    return SCHEME_DESCRIPTIONS[scheme]?.shortName || scheme;
  });

  const lastScheme = formattedSchemes.pop();
  const otherSchemes = formattedSchemes.join(', ');
  
  return `Consulting fees for government subsidy work for ${otherSchemes}, & ${lastScheme} for your new firm ${policyText}.`;
}

/**
 * Gets the description for a specific scheme
 * @param schemeName Name of the scheme
 * @returns Scheme description object or null if not found
 */
export function getSchemeDescription(schemeName: string): SchemeDescription | null {
  return SCHEME_DESCRIPTIONS[schemeName] || null;
}

/**
 * Gets all available scheme names
 * @returns Array of all available scheme names
 */
export function getAllSchemeNames(): string[] {
  return Object.keys(SCHEME_DESCRIPTIONS);
}
