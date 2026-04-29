import { supabase, getAdventures, createAdventure, updateAdventureBounty, SecureAdventure, Adventure } from '../lib/supabase';

// Sample adventure data for testing the Prole Control system
export const sampleAdventures: Omit<Adventure, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    title: "Escape The Midlands Matrix",
    codename: "Escape The Midlands Matrix",
    status: "complete",
    description: "No cash, no cares, it's time for this Prole to escape and explore what's left of Freedom in 2026",
    lat: 53.018028,
    lng: -1.308472,
    bounty_target: 50.00,
    bounty_current: 50.00,
    video_url: 'https://www.youtube.com/@ProleAdventures',
    thumbnail_url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop'
  },
  {
    title: "The Land That Time Begot",
    codename: "The Land That Time Begot",
    status: "complete",
    description: "The Prole visits a town that's been dragged, kicking and screaming into the 4th Industrial revolution.",
    lat: 53.020111,
    lng: -1.327778,
    bounty_target: 0.00,
    bounty_current: 0.00,
    video_url: 'https://www.youtube.com/@ProleAdventures',
    thumbnail_url: '/images/Missions/The_Land_That_time_Begot.jpg'
  }
];

// Convert sample data to SecureAdventure format with jitter applied
const convertToSecureAdventures = (adventures: Omit<Adventure, 'id' | 'created_at' | 'updated_at'>[]): SecureAdventure[] => {
  return adventures.map(adventure => {
    // Apply jitter to scouting missions
    if (adventure.status === 'scouting') {
      const jitterLat = adventure.lat + (Math.random() - 0.5) * 0.02;
      const jitterLng = adventure.lng + (Math.random() - 0.5) * 0.02;

      return {
        ...adventure,
        id: Math.random().toString(36).substring(2, 11),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        display_lat: jitterLat,
        display_lng: jitterLng,
        display_title: adventure.codename,
        display_description: 'CLASSIFIED MISSION - INTEL LOCKED'
      };
    }

    return {
      ...adventure,
      id: Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      display_lat: adventure.lat,
      display_lng: adventure.lng,
      display_title: adventure.codename,
      display_description: adventure.description || '',
      video_url: (adventure as any).video_url,
      thumbnail_url: (adventure as any).thumbnail_url
    };
  });
};

// Adventure management service
export class AdventureService {

  // Initialize sample data if no adventures exist
  static async initializeSampleData(): Promise<void> {
    // Skip if Supabase is not configured
    if (!supabase) {
      console.log('Supabase not configured, skipping database initialization');
      return;
    }

    try {
      const existingAdventures = await getAdventures();

      // Only create sample data if no adventures exist
      if (existingAdventures.length === 0) {
        console.log('Creating sample adventure data...');

        for (const adventureData of sampleAdventures) {
          await createAdventure(adventureData);
        }

        console.log('Sample adventure data created successfully');
      }
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
      throw error;
    }
  }

  // Get adventures with security filtering applied
  static async getSecureAdventures(): Promise<SecureAdventure[]> {
    // If Supabase is not configured, return mock data directly
    if (!supabase) {
      console.log('Supabase not configured, using mock adventure data');
      return convertToSecureAdventures(sampleAdventures);
    }

    try {
      // This would use the secure view in production
      // For now, we'll apply client-side filtering as a demonstration
      const adventures = await getAdventures();

      return adventures.map(adventure => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDescription = (adventure as any).description ?? adventure.display_description ?? 'Mission brief pending.';

        if (adventure.status === 'scouting') {
          // Jitter coordinates to obscure exact location — but show real description
          const jitterLat = adventure.lat + (Math.random() - 0.5) * 0.025;
          const jitterLng = adventure.lng + (Math.random() - 0.5) * 0.025;

          return {
            ...adventure,
            display_lat: jitterLat,
            display_lng: jitterLng,
            display_title: adventure.codename,
            display_description: rawDescription,
          };
        }

        return {
          ...adventure,
          display_lat: adventure.lat,
          display_lng: adventure.lng,
          display_title: adventure.codename,
          display_description: rawDescription,
          video_url: (adventure as any).video_url,
          thumbnail_url: (adventure as any).thumbnail_url
        };
      });
    } catch (error) {
      console.error('Failed to fetch secure adventures, falling back to mock data:', error);
      // Fallback to mock data on any error
      return convertToSecureAdventures(sampleAdventures);
    }
  }

  // Update adventure bounty with contribution
  static async contributeToMission(adventureId: string, amount: number): Promise<Adventure> {
    // Skip if Supabase is not configured
    if (!supabase) {
      console.log('Supabase not configured, cannot contribute to mission');
      throw new Error('Supabase not configured');
    }

    try {
      // In a real implementation, this would include user authentication
      // and transaction processing

      const updatedAdventure = await updateAdventureBounty(adventureId, amount);
      console.log(`Contributed $${amount} to mission ${adventureId}`);

      return updatedAdventure;
    } catch (error) {
      console.error('Failed to contribute to mission:', error);
      throw error;
    }
  }

  // Security validation for redaction
  static validateRedaction(adventure: SecureAdventure): {
    isSecure: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check if sensitive data is exposed for scouting missions
    if (adventure.status === 'scouting') {
      // For scouting missions, we expect to see only codename and classified description
      if (adventure.display_description && adventure.display_description !== 'CLASSIFIED MISSION - INTEL LOCKED') {
        warnings.push('Full description exposed in scouting mission');
      }

      // Check if coordinates appear to be exact (this is a simplified check)
      const latDiff = Math.abs(adventure.lat - adventure.display_lat);
      const lngDiff = Math.abs(adventure.lng - adventure.display_lng);

      if (latDiff < 0.001 && lngDiff < 0.001) {
        warnings.push('Coordinates may not be sufficiently obfuscated for scouting mission');
      }
    }

    return {
      isSecure: warnings.length === 0,
      warnings
    };
  }

  // Generate mission statistics
  static generateMissionStats(adventures: SecureAdventure[]) {
    const stats = {
      total: adventures.length,
      scouting: adventures.filter(a => a.status === 'scouting').length,
      greenlit: adventures.filter(a => a.status === 'greenlit').length,
      active: adventures.filter(a => a.status === 'active').length,
      complete: adventures.filter(a => a.status === 'complete').length,
      totalBountyTarget: adventures.reduce((sum, a) => sum + a.bounty_target, 0),
      totalBountyCurrent: adventures.reduce((sum, a) => sum + a.bounty_current, 0),
      completionRate: adventures.length > 0 ? adventures.filter(a => a.status === 'complete').length / adventures.length * 100 : 0
    };

    return stats;
  }
}
