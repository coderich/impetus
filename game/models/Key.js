import { isDirection } from '../config.translators';

export default {
  use: async ({ $this, $dao, player, event: direction }) => {
    if (!isDirection(direction)) throw new Error('{{ "Syntax: USE {Item} {Direction}" | error }}');
    const key = await $this.get();
    const room = await player.hydrate('room');
    const exit = room.exits[direction];
    if (!exit) throw new Error('There is nothing in that direction!');
    const target = await $dao.db.get(exit, {});
    if (!target.unlock) throw new Error('There is nothing to unlock in that direction.');
    if (key.targets.indexOf(exit) === -1 && key.targets.indexOf(target.template) === -1) throw new Error(`The ${key.name} does not work on the ${target.name}.`);
    return target.unlock().then(() => player.emit('data', `You unlock the ${target.name}.`));
  },
};
