export * from './liveSession';
export * from './soapNotes';
export * from './discharge';
export * from './referral';

import { liveSessionTemplate } from './liveSession';
import { soapStandardTemplate, soapExpandedTemplate } from './soapNotes';
import { dischargeTemplate } from './discharge';
import { referralTemplate } from './referral';

export const templates = [
  liveSessionTemplate,
  soapStandardTemplate,
  soapExpandedTemplate,
  dischargeTemplate,
  referralTemplate
];