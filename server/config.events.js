export default {
  '$server:ready': [
    async ({ $db, $emit }) => {
      const installed = await $db.get('impetus.installed');
      if (!installed) $emit('install');
    },
  ],

  '$server:connection': [
    ({ socket }) => {
      socket.emit('data', 'Welcome to Ipetus!');
    },
  ],

  '$server:data': [
    ({ socket, event }) => {
      if (event) socket.broadcast.emit('data', event);
    },
  ],

  install: [
    ({ $db }) => {
      $db.set('impetus', { installed: true });
    },
  ],
};
