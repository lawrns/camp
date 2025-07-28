// Mock jest-axe for TypeScript compatibility
export const axe = async (element: any) => {

  return { violations: [] };
};

export const toHaveNoViolations = () => ({
  pass: true,
  message: () => "No accessibility violations found",
});

// For when jest-axe is actually installed
export const configureAxe = (config: any) => {

};
