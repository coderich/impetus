export default {
  Room: {
    describe: async ({ $model }) => {
      const room = await $model.get();
      return `^c${room.name}\n\t^:${room.description}\n^gExits: ${Object.keys(room.exits).join(', ')}: `;
    },
  },
};
