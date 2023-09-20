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
      {
        name: 'mention',
        description: "Who do you want the bot to @?",
        type: ApplicationCommandOptionType.Mentionable,
      },
    ],
  },
  {
    name: 'stats',
    description: "Get game stats of a player from this server",
    options: [
      {
        name: 'game',
        description: "Choose a game",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Apex Legends",
            value: 'apex',
          },
        ],
        required: true,
      },
      {
        name: 'platform',
        description: "Choose a platform",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Steam (Origin Username)",
            value: 'origin',
          },
          {
            name: "Playstation",
            value: 'psn',
          },
          {
            name: "Xbox",
            value: 'xbl',
          },
        ],
        required: true,
      },
      {
        name: 'target',
        description: "Who do you want to get stats for?",
        type: ApplicationCommandOptionType.Mentionable,
        required: true,
      }
    ],
  },
  {
    name: 'stats-search',
    description: "Search game stats of a player from tracker.gg",
    options: [
      {
        name: 'game',
        description: "Choose a game",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Apex Legends",
            value: 'apex',
          },
        ],
        required: true,
      },
      {
        name: 'platform',
        description: "Choose a platform",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Steam (Origin Username)",
            value: 'origin',
          },
          {
            name: "Playstation",
            value: 'psn',
          },
          {
            name: "Xbox",
            value: 'xbl',
          },
        ],
        required: true,
      },
      {
        name: 'username',
        description: "Who do you want to get stats for?",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'mention',
        description: "Who do you want the bot to @?",
        type: ApplicationCommandOptionType.Mentionable,
      },
    ]
  },
  {
    name: 'session',
    description: "Get the last session of games of a player from this server",
    options: [
      {
        name: 'game',
        description: "Choose a game",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Apex Legends",
            value: 'apex',
          },
        ],
        required: true,
      },
      {
        name: 'platform',
        description: "Choose a platform",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Steam (Origin Username)",
            value: 'origin',
          },
          {
            name: "Playstation",
            value: 'psn',
          },
          {
            name: "Xbox",
            value: 'xbl',
          },
        ],
        required: true,
      },
      {
        name: 'target',
        description: "Who do you want to get stats for?",
        type: ApplicationCommandOptionType.Mentionable,
        required: true,
      }
    ],
  },
  {
    name: 'session-search',
    description: "Search game stats of a player from tracker.gg",
    options: [
      {
        name: 'game',
        description: "Choose a game",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Apex Legends",
            value: 'apex',
          },
        ],
        required: true,
      },
      {
        name: 'platform',
        description: "Choose a platform",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "Steam (Origin Username)",
            value: 'origin',
          },
          {
            name: "Playstation",
            value: 'psn',
          },
          {
            name: "Xbox",
            value: 'xbl',
          },
        ],
        required: true,
      },
      {
        name: 'username',
        description: "Who do you want to get stats for?",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'mention',
        description: "Who do you want the bot to @?",
        type: ApplicationCommandOptionType.Mentionable,
      },
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