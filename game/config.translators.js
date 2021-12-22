export const isDirection = v => v.match(/^([nsewud]|ne|nw|se|sw)$/i);

export default {
  data: {
    'Player.none': v => v.match(/^$/),
    'Player.move': v => isDirection(v) && v,
    'Player.look': (v) => {
      const matches = v.match(/^l(?:ook|oo|o)?\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.chat': (v) => {
      const matches = v.match(/^\.\s*(.+)$/);
      return matches ? matches[1] : null;
    },
    'Player.greet': (v) => {
      const matches = v.match(/^gr(?:eet|ee|e)?\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.open': (v) => {
      const matches = v.match(/^op(?:en|e)?\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.close': (v) => {
      const matches = v.match(/^cl(?:ose|os|o)?\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.ask': (v) => {
      const matches = v.match(/^ask\s+(.+)\s+"(.*)"$/i);
      return matches ? { target: matches[1], query: matches[2] } : null;
    },
    'Player.unknown': v => v,
  },
};
