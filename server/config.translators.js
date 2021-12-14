export default {
  data: {
    'Player.scan': v => v.match(/^$/),
    'Player.move': v => v.match(/^([nsewud]|ne|nw|se|sw)\s*$/i),
    'Player.chat': v => v.match(/^.+$/),
  },
};
