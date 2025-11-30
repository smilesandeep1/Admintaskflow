/**
 * Utility functions for user display formatting
 */

import type { Profile } from "@/types/types";

/**
 * Format user name with official designation in brackets
 * @param user - User profile object
 * @returns Formatted string: "Full Name (Official Designation)" or just "Full Name"
 */
export function formatUserName(user: Profile | null | undefined): string {
  if (!user) return "N/A";
  
  const name = user.full_name || "Unknown";
  const designation = user.official_designation;
  
  if (designation) {
    return `${name} (${designation})`;
  }
  
  return name;
}

/**
 * Format user name with official designation for display in UI
 * @param fullName - User's full name
 * @param officialDesignation - User's official designation
 * @returns Formatted string: "Full Name (Official Designation)" or just "Full Name"
 */
export function formatUserNameWithDesignation(
  fullName: string | null | undefined,
  officialDesignation: string | null | undefined
): string {
  if (!fullName) return "N/A";
  
  if (officialDesignation) {
    return `${fullName} (${officialDesignation})`;
  }
  
  return fullName;
}
