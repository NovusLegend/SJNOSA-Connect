export interface ClassIdentity {
  name: string;
  icon: string;
  color: string;
  bg: string;
  badgeUrl: string;
}

export const getClassIdentity = (year: number | null | undefined): ClassIdentity => {
  if (!year) {
    return { 
        name: 'Alumni', 
        icon: '🎓', 
        color: 'text-gray-600', 
        bg: 'bg-gray-100',
        badgeUrl: `https://api.dicebear.com/9.x/glass/svg?seed=Alumni&backgroundColor=b0b0b0`
    };
  }

  // Algorithm to map years to names deterministically
  const identities = [
    { name: 'Pantheons', icon: '🏛️', color: 'text-yellow-700', bg: 'bg-yellow-50', hex: 'eab308' }, // 2025
    { name: 'Spartans', icon: '🛡️', color: 'text-red-700', bg: 'bg-red-50', hex: 'dc2626' },    // 2024
    { name: 'Titans', icon: '⚡', color: 'text-blue-700', bg: 'bg-blue-50', hex: '2563eb' },     // 2023
    { name: 'Vikings', icon: '🪓', color: 'text-green-700', bg: 'bg-green-50', hex: '16a34a' },   // 2022
    { name: 'Samurai', icon: '⚔️', color: 'text-purple-700', bg: 'bg-purple-50', hex: '9333ea' }, // 2021
    { name: 'Knights', icon: '🏰', color: 'text-indigo-700', bg: 'bg-indigo-50', hex: '4f46e5' }, // 2020
  ];

  // Logic: 2025 is Pantheons (index 0). 
  // 2024 is Spartans (index 1).
  const baseYear = 2025;
  const diff = baseYear - year;
  // Ensure positive index for modulo
  const index = (Math.abs(diff) % identities.length);
  
  const identity = identities[index];

  return {
    name: identity.name,
    icon: identity.icon,
    color: identity.color,
    bg: identity.bg,
    badgeUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${identity.name}&backgroundColor=${identity.hex}`
  };
};