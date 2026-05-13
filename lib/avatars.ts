/**
 * High-Fidelity Avatar Generation Utility
 * 
 * Provides branded, consistent avatars using DiceBear 9.x Initials.
 * Ensures that every user has a professional visual identity,
 * whether they sign up via Email or OAuth.
 */

export const getBrandedAvatar = (email: string) => {
  const seed = encodeURIComponent(email || "user@cscn.edu");
  
  // High-fidelity 'Notionists' style for a professional, unique visual identity
  // We use the email as a seed to ensure 100% uniqueness even if names are identical.
  const params = new URLSearchParams({
    seed,
    backgroundColor: "b6e3f4,c0aede,d1d4f9", // Sophisticated Blue/Violet/Indigo palette
    backgroundType: "solid,gradientLinear",
  });

  return `https://api.dicebear.com/9.x/notionists/svg?${params.toString()}`;
};
