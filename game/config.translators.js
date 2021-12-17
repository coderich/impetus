export const isDirection = v => v.match(/^([nsewud]|ne|nw|se|sw)$/i);

export default {
  data: {
    'Player.none': v => v.match(/^$/),
    'Player.look': (v) => {
      const matches = v.match(/^l(?:\s(o|oo|ook)?)\s*(.*)$/i);
      return matches ? matches[2] : null;
    },
    'Player.move': v => isDirection(v) && v,
    'Player.chat': v => v.match(/^.+$/) && v,
  },
};
