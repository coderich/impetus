export default {
  ant: {
    name: 'ant',
    attacks: ['Weapon.bite'],
    stats: {
      hp: '1d4+2',
      str: 1,
      dex: '1d2',
      int: 0,
      ac: 5,
      dc: 1,
      exp: 1,
    },
  },
  rat: {
    name: 'rat',
    attacks: ['Weapon.bite', 'Weapon.claw'],
    stats: {
      hp: '1d6+3',
      str: '1d2+1',
      dex: '1d3',
      int: 0,
      ac: 8,
      dc: 1,
      exp: 1,
    },
  },
};

// hp: frail, fit, sturdy
// str: small, average, large
// agi: slow, quick, nimble
// int: dull, bright, clever

// elite
// fat, skinny, angry
