export type TournamentFormat = 'liga' | 'eliminacion';
export type TeamAssignment = 'manual' | 'auto';

export interface Player {
  id: string;
  name: string;
  team: string;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Goals: number;
  player2Goals: number;
  played: boolean;
  round: number;
  fecha?: number;
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  players: Player[];
  matches: Match[];
  currentRound: number;
  isComplete: boolean;
  createdAt: number;
}

export const PES_TEAMS = [
  'Barcelona',
  'Real Madrid',
  'Bayern',
  'Juventus',
  'PSG',
  'Manchester United',
  'Liverpool',
  'Chelsea',
  'Manchester City',
  'Arsenal',
  'Atlético Madrid',
  'Milan',
  'Inter',
  'Dortmund',
  'Tottenham',
  'Napoli',
];

export const LEAGUES: { [key: string]: string[] } = {
  'Todas': PES_TEAMS,
  'Argentina': [
    'Boca Juniors',
    'River Plate',
    'Racing Club',
    'Independiente',
    'San Lorenzo',
    'Vélez Sarsfield',
    'Estudiantes',
    'Lanús',
    'Newell\'s Old Boys',
    'Rosario Central',
    'Argentinos Juniors',
    'Arsenal',
    'Atlético Tucumán',
    'Banfield',
    'Barracas Central',
    'Belgrano',
    'Central Córdoba',
    'Colón',
    'Defensa y Justicia',
    'Gimnasia y Esgrima',
    'Godoy Cruz',
    'Huracán',
    'Instituto',
    'Platense',
    'Sarmiento',
    'Talleres',
    'Tigre',
    'Unión',
  ],
  'Spain': [
    'Barcelona',
    'Real Madrid',
    'Atlético Madrid',
    'Sevilla',
    'Valencia',
    'Villarreal',
    'Real Sociedad',
    'Athletic Bilbao',
    'Betis',
    'Celta Vigo',
  ],
  'England': [
    'Manchester United',
    'Liverpool',
    'Chelsea',
    'Manchester City',
    'Arsenal',
    'Tottenham',
    'Newcastle',
    'Aston Villa',
    'West Ham',
    'Brighton',
  ],
  'Germany': [
    'Bayern',
    'Dortmund',
    'RB Leipzig',
    'Bayer Leverkusen',
    'Wolfsburg',
    'Eintracht Frankfurt',
    'Borussia Mönchengladbach',
    'Hertha BSC',
    'Schalke 04',
    'Werder Bremen',
  ],
  'Italy': [
    'Juventus',
    'Milan',
    'Inter',
    'Napoli',
    'Roma',
    'Lazio',
    'Atalanta',
    'Fiorentina',
    'Sampdoria',
    'Torino',
  ],
  'France': [
    'PSG',
    'Marseille',
    'Lyon',
    'Monaco',
    'Lille',
    'Nice',
    'Lens',
    'Rennes',
    'Reims',
    'Strasbourg',
  ],
};