require('dotenv/config');
const { 
  REST,
  Routes, 
  ApplicationCommandOptionType, 
} = require('discord.js');

const commands = [
  {
    name: 'roast',
    description: 'Cook someone up',
    options: [
      {
        name: 'name',
        description: "Who's getting roasted?",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'topic',
        description: "What do you want to roast them about?",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'specifically',
        description: "Anything specific?",
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  {
    name: 'voice-samples',
    description: 'Show voice samples and hear how the roast would sound',
    options: [
      {
        name: 'section',
        description: 'displays a section a voice samples 1 - 6',
        type: ApplicationCommandOptionType.Number,
        required: true,
        choices: [
          {
            name: '1',
            value: 1,
          },
          {
            name: '2',
            value: 2,
          },
          {
            name: '3',
            value: 3,
          },
          {
            name: '4',
            value: 4,
          },
          {
            name: '5',
            value: 5,
          },
          {
            name: '6',
            value: 6,
          },
        ]
      }
    ]
  },
];

const rest = new REST({version: 10}).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try{
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID, 
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log('Commands successfully registered');
  }catch(err){
    console.error(`There was an error: ${err}`);
  }
})();