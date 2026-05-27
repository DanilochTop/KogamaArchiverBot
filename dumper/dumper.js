const GameQueue = require('./gameQueue');
const Bot = require('./bot');

class Dumper {
	static async init() {
		
	}

	static async start() {
		while (true) {
			let gameData = GameQueue.get();

			if (gameData) {
				await this.dumpGame(gameData).catch(console.error);
			} else {
				await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking the queue again
			}
		}
	}

	static async dumpGame(gameData) {
		let bot = new Bot();

		await bot.dumpGame(gameData);
	}
}

module.exports = Dumper;