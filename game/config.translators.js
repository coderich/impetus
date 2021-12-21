export const isDirection = v => v.match(/^([nsewud]|ne|nw|se|sw)$/i);

export default {
  data: {
    'Player.none': v => v.match(/^$/),
    'Player.look': (v) => {
      const matches = v.match(/^l(?:ook|oo|o)?\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.move': v => isDirection(v) && v,
    'Player.chat': (v) => {
      const matches = v.match(/^\.\s*(.+)$/);
      return matches ? matches[1] : null;
    },
    'Player.greet': (v) => {
      const matches = v.match(/^greet\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.open': (v) => {
      const matches = v.match(/^op(?:en|e)?\s*(.*)$/i);
      return matches ? matches[1] : null;
    },
    'Player.ask': (v) => {
      const matches = v.match(/^ask\s+(.+)\s+"(.*)"$/i);
      return matches ? { target: matches[1], query: matches[2] } : null;
    },
    'Player.unknown': v => v,
  },
};
