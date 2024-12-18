import type { AIFunction } from './types';

export const searchFunctions: AIFunction[] = [
  {
    name: "searchRecords",
    description: "Searches through chat history and patient records",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query string",
        required: true
      },
      {
        name: "filters",
        type: "object",
        description: "Search filters",
        required: false
      },
      {
        name: "dateRange",
        type: "object",
        description: "Date range for the search",
        required: false
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Search results with pagination",
      example: {
        results: ["array of matching records"],
        total: 10,
        page: 1
      }
    }
  }
];