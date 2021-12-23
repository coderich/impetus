export default {
  $ready: async ({ $dao }) => {
    await $dao.db.set('autoIncrement', 0);
    const config = await $dao.config.get('');

    return Promise.all(Object.entries(config).map(([root, value]) => {
      return Promise.all(Object.entries(value).map(async ([id, definition]) => {
        const key = `${root}.${id}`;
        const model = await $dao.db.set(key, definition);
        await (model.install ? model.install() : Promise.resolve());
        return model;
      }));
    })).then((models) => {
      return Promise.all(models.flat().map(model => (model.init ? model.init() : Promise.resolve())));
    });
  },

  '$socket:connection': async ({ $dao, socket }) => {
    // const { handshake: { query } } = socket;
    // const { uid } = query;

    // Player setup
    const id = await $dao.db.inc('autoIncrement');
    const room = await $dao.db.get('Room.car');
    socket.data.Player = await $dao.db.set(`Player.${id}`, { id, room: 'Room.car' });
    socket.data.Player.socket = socket;
    await socket.data.Player.toRoom({ $dao, socket, room });

    socket.emit(
      'dialog',
      "^gIt's late at night, and your car has just ^rblown a tire ^gwhile driving along a secluded road. You get out and look inside your trunk; only to realize you no longer have a spare on you...",
      async () => {
        await socket.emit(
          'dialog',
          `
^gStanding in bewilderment, your mind races as to where your spare could possibly be; you KNOW that you had one.

^gAhead you notice a clear in the trees and arrive at a ^yDirt Path ^gadjacent to the road. Unable to see far ahead, you wonder if maybe this could be the driveway to someone's home.

Desperate for a little help, you decide to follow the path ^Knorth^...`,
          async (name) => {
            socket.emit('clear');
            await socket.data.Player.set('name', name);
            socket.data.Player.scan({ $this: socket.data.Player, socket });
          },
        );
      }
    );
  },
};
