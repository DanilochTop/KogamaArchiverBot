require('dotenv').config({ quiet: true });

const Discord = require('./discord/discord');
const Dumper = require('./dumper/dumper');

async function main() {
	console.log('Kogama Archiver Bot started!');

	await Discord.init();
	await Discord.start();

	await Dumper.init();
	await Dumper.start();
}

main().catch(console.error);