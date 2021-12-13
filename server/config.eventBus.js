export default {
  data: {
    'player:scan': v => v.match(/^$/),
    'player:move': v => v.match(/^([nsewud]|ne|nw|se|sw)\s*$/i),
    'player:chat': v => v.match(/^.+$/),
  },
};
