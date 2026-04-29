import { SecureAdventure, Adventure } from '../lib/supabase';

// Mock data for testing when Supabase is not available
export const mockAdventures: SecureAdventure[] = [
  {
    id: '1',
    display_title: 'Escape The Midlands Matrix',
    codename: 'Escape The Midlands Matrix',
    status: 'complete',
    display_description: "No cash, no cares, it's time for this Prole to escape and explore what's left of Freedom in 2026",

    display_lat: 53.018028,
    display_lng: -1.308472,
    lat: 53.018028,
    lng: -1.308472,
    bounty_target: 50.00,
    bounty_current: 50.00,
    video_url: 'https://www.youtube.com/@ProleAdventures',
    thumbnail_url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '7',
    display_title: 'The Land That Time Begot',
    codename: 'The Land That Time Begot',
    status: 'complete',
    display_description: "The Prole visits a town that's been dragged, kicking and screaming into the 4th Industrial revolution.",
    display_lat: 53.020111,
    display_lng: -1.327778,
    lat: 53.020111,
    lng: -1.327778,
    bounty_target: 0.00,
    bounty_current: 0.00,
    video_url: 'https://www.youtube.com/@ProleAdventures',
    thumbnail_url: '/images/Missions/The_Land_That_time_Begot.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class MockAdventureService {
  private static adventures = [...mockAdventures];

  // Mock implementation of getAdventures
  static async getAdventures(): Promise<SecureAdventure[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return a deep copy to simulate real data fetching
    return this.adventures.map(adventure => ({ ...adventure }));
  }

  // Mock implementation of createAdventure
  static async createAdventure(adventure: Omit<Adventure, 'id' | 'created_at' | 'updated_at'>): Promise<Adventure> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const newAdventure: Adventure = {
      id: Math.random().toString(36).substr(2, 9),
      ...adventure,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.adventures.push({
      ...newAdventure,
      display_title: newAdventure.status === 'scouting' ? newAdventure.codename : newAdventure.title,
      display_description: newAdventure.status === 'scouting' ? 'CLASSIFIED MISSION - INTEL LOCKED' : newAdventure.description,
      display_lat: newAdventure.status === 'scouting'
        ? newAdventure.lat + (Math.random() - 0.5) * 0.02
        : newAdventure.lat,
      display_lng: newAdventure.status === 'scouting'
        ? newAdventure.lng + (Math.random() - 0.5) * 0.02
        : newAdventure.lng
    });

    return newAdventure;
  }

  // Mock implementation of updateAdventureBounty
  static async updateAdventureBounty(id: string, amount: number): Promise<Adventure> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const adventureIndex = this.adventures.findIndex(adv => adv.id === id);
    if (adventureIndex === -1) {
      throw new Error('Adventure not found');
    }

    const secureAdventure = this.adventures[adventureIndex];

    // Convert SecureAdventure back to Adventure
    const adventure: Adventure = {
      id: secureAdventure.id,
      title: secureAdventure.codename, // Use codename as title for mock
      codename: secureAdventure.codename,
      status: secureAdventure.status,
      description: secureAdventure.display_description,
      lat: secureAdventure.lat,
      lng: secureAdventure.lng,
      bounty_target: secureAdventure.bounty_target,
      bounty_current: amount,
      created_at: secureAdventure.created_at,
      updated_at: new Date().toISOString()
    };

    // Update the stored adventure
    this.adventures[adventureIndex] = {
      ...secureAdventure,
      bounty_current: amount,
      updated_at: adventure.updated_at
    };

    return adventure;
  }

  // Check if running in mock mode
  static isMockMode(): boolean {
    return true; // Always true for this mock service
  }

  // Initialize sample data (mock implementation)
  static async initializeSampleData(): Promise<void> {
    // For mock mode, we already have data, so just return
    return Promise.resolve();
  }

  // Get secure adventures (mock implementation)
  static async getSecureAdventures(): Promise<SecureAdventure[]> {
    return this.getAdventures();
  }

  // Validate redaction (mock implementation)
  static validateRedaction(adventure: SecureAdventure): {
    isSecure: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    if (adventure.status === 'scouting') {
      if (adventure.display_description !== 'CLASSIFIED MISSION - INTEL LOCKED') {
        warnings.push('Full description exposed in scouting mission');
      }

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
}