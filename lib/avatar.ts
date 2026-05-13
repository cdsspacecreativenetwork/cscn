export const generateTapbackAvatar = (nameOrId: string) => {
  // Use a hash or simple string cleaning to ensure URL safety
  const cleanName = nameOrId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Random color 1-12 based on string length to keep it consistent per user
  const colorIndex = (cleanName.length % 12) + 1;
  
  return `https://www.tapback.co/api/avatar/${cleanName}.webp?color=${colorIndex}`;
};
