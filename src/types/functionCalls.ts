import type { AIFunction } from './functions/types';
import { templateFunctions } from './functions/templateFunctions';
import { patientFunctions } from './functions/patientFunctions';
import { sessionFunctions } from './functions/sessionFunctions';
import { exportFunctions } from './functions/exportFunctions';
import { searchFunctions } from './functions/searchFunctions';

export type { AIFunction, FunctionParameter } from './functions/types';

export const aiFunctions: AIFunction[] = [
  ...templateFunctions,
  ...patientFunctions,
  ...sessionFunctions,
  ...exportFunctions,
  ...searchFunctions
];