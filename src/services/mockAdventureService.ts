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
    video_url: 'https://www.youtube.com/watch?v=b-tJOvF5w-k',
    thumbnail_url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop',
    episode_number: 1,
    audit_date: '2026-03-12',
    place: 'Kimberley, Notts',
    rent_mo: '£575–£700 room / £850 1-bed',
    basket: '£38 weekly basics',
    safety: 'Mixed — visible deprivation',
    access: 'Walkable centre; weak evening buses',
    youtube_id: 'b-tJOvF5w-k',
    story_slug: 'escape-the-midlands-matrix',
    score: 84,
    tomato_score: 7,
    verdict_line: '£11 bought a full day',
    actual_spend_gbp: 11.20,
    kebab_index_gbp: 6.50,
    tomato_index_gbp: 0.85,
    exchanges_count: 5,
    free_pins_found_count: 3,
    hassle_log: [{ type: 'scoped', note: 'Council CCTV operator watched for 10 mins' }],
    conditions_line: 'Overcast, 9°C, Tuesday morning lull',
    commissioned: false,
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
    video_url: 'https://www.youtube.com/watch?v=K2H9w-qfbMw',
    thumbnail_url: '/images/Missions/The_Land_That_time_Begot.jpg',
    episode_number: 2,
    audit_date: '2026-04-05',
    place: 'Eastwood, Notts',
    rent_mo: '£525–£650 room / £795 1-bed',
    basket: '£41 weekly basics',
    safety: 'Variable — quiet streets, rough pockets',
    access: 'Good daytime buses; car helps after dark',
    youtube_id: 'K2H9w-qfbMw',
    story_slug: 'the-land-that-time-begot',
    score: 68,
    tomato_score: 5,
    verdict_line: 'Public mat heavily degraded; disguise density high',
    actual_spend_gbp: 18.50,
    kebab_index_gbp: 7.95,
    tomato_index_gbp: 1.10,
    exchanges_count: 3,
    free_pins_found_count: 1,
    hassle_log: [
      { type: 'stopped', note: 'Private security near decommissioned pithead' },
      { type: 'cash_refused', note: 'Town center kiosk cashless only' }
    ],
    conditions_line: 'High wind, drizzle, heavy surveillance grid',
    commissioned: true,
    funder_credit: 'Operative @NorthGrit',
    commissioning_question: 'Is there any public commons left around the old coal artery?',
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
      lat: secureAdventure.lat ?? secureAdventure.display_lat,
      lng: secureAdventure.lng ?? secureAdventure.display_lng,
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

  // Mock implementation of updateAdventure
  static async updateAdventure(id: string, updates: Partial<Adventure>): Promise<Adventure> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const index = this.adventures.findIndex(adv => adv.id === id);
    if (index === -1) {
      throw new Error('Adventure not found');
    }

    const current = this.adventures[index];
    const updated: SecureAdventure = {
      ...current,
      ...updates,
      display_title: updates.codename || updates.title || current.display_title,
      display_description: updates.description ?? current.display_description,
      display_lat: updates.lat ?? current.display_lat,
      display_lng: updates.lng ?? current.display_lng,
      updated_at: new Date().toISOString()
    };

    this.adventures[index] = updated;

    return {
      id: updated.id,
      title: updated.display_title,
      codename: updated.codename,
      status: updated.status,
      lat: updated.lat ?? updated.display_lat,
      lng: updated.lng ?? updated.display_lng,
      bounty_target: updated.bounty_target,
      bounty_current: updated.bounty_current,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      ...updates
    };
  }

  // Mock implementation of deleteAdventure
  static async deleteAdventure(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.adventures = this.adventures.filter(adv => adv.id !== id);
    return true;
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

      if (adventure.lat !== undefined && adventure.lng !== undefined) {
        const latDiff = Math.abs(adventure.lat - adventure.display_lat);
        const lngDiff = Math.abs(adventure.lng - adventure.display_lng);

        if (latDiff < 0.001 && lngDiff < 0.001) {
          warnings.push('Coordinates may not be sufficiently obfuscated for scouting mission');
        }
      }
    }

    return {
      isSecure: warnings.length === 0,
      warnings
    };
  }
}
