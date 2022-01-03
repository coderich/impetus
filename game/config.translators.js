export const isDirection = v => v.match(/^([nsewud]|ne|nw|se|sw)$/i);

export default {
  data: {
    'Player.none': v => v.match(/^$/),
    'Player.break': v => v.match(/^;$/) && v,
    'Player.move': v => isDirection(v) && v,
    'Player.inventory': v => v.match(/^i(?:nventory|nventor|nvento|nvent|nven|nve|nv)?$/i) && v,
    'Player.attack': (v) => {
      const matches = v.match(/^\ba(?:ttack|ttac|tta|tt)?\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.look': (v) => {
      const matches = v.match(/^\bl(?:ook|oo|o)?\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.chat': (v) => {
      const matches = v.match(/^\.\s*(.+)$/);
      return matches ? matches[1] : null;
    },
    'Player.greet': (v) => {
      const matches = v.match(/^\bgr(?:eet|ee|e)?\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.take': (v) => {
      const matches = v.match(/^\bg(?:et|e)?\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.drop': (v) => {
      const matches = v.match(/^\bdro(?:p)?\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.open': (v) => {
      const matches = v.match(/^\bop(?:en|e)?\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.close': (v) => {
      const matches = v.match(/^\bcl(?:ose|os|o)?\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.use': (v) => {
      const matches = v.match(/^\buse\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.ask': (v) => {
      const matches = v.match(/^\bask\b\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.unknown': v => v,
  },
};
