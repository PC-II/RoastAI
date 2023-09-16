require('dotenv/config');
const { 
  Client, 
  IntentsBitField, 
  ActivityType,
} = require('discord.js');
const { OpenAI } = require('openai');
const fetch = require('node-fetch');
const { usernames } = require('./usernames');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildVoiceStates,
  ]
})

client.on('ready', (c) => {
  console.log('the bot is online');
  c.user.setActivity({
    name: "Chilling ❄️❄️❄️",
    type: ActivityType.Custom
  })
});

const openai = new OpenAI({apiKey: process.env.API_KEY});

client.on('interactionCreate', async (interaction) => {
  if(!interaction.isChatInputCommand()) return;
  if(interaction.channel.id !== process.env.CHANNEL_ID){
    await interaction.reply({content: "You're in the wrong channel buddy...\nGo to the one that says: 🔥-roasting", ephemeral: true})
    return;
  }
  
  if(interaction.commandName === 'roast'){
    console.log(`Roast request from: ${interaction.member.displayName}`);
    setRoasting();

    const name = interaction.options.get('name').value;
    const topic = interaction.options.get('topic').value;
    const specific = interaction.options.get('specifically')?.value;
    const mention = interaction.options.get('mention')?.member;

    // CHAT GPT PROMPT
    let prompt = `Roast my friend ${name} about how terrible they are with/in ${topic} and make it FUNNY without holding back.`;
    let promptPreview = `Prompt { Name: ${name} | Topic: ${topic} `;
    if(specific){
      prompt += `Make sure to mention and emphasize ${specific} thoughout the response.`;
      promptPreview += `| Specifically: ${specific} `;
    }
    if(mention){
      promptPreview += `} ${mention}\n\n`;
    } else {
      promptPreview += `}\n\n`;
    }

    // CHAT GPT GENERATE RESPONSE
    await interaction.deferReply();
    try{
      const completedChat = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {"role": "system", "content": `You are a sarcastic bot with EXTREMELY inappropriate and immature jokes. You have the dialect of an articulate, but slightly ghetto person. Be sure to sprinkle in a few slang insults relative to the prompt or make up one and use it. Also include a few exclamatories to emphasize the main roasting points when possible. THE REPLY MUST BE THREE PRAGRAPHS MAX USING LESS THAN 1800 CHARACTERS.`},
          {"role": "user", "content": prompt},
        ],
      });
      console.log(promptPreview + completedChat.choices[0].message.content); 

      await interaction.editReply(promptPreview + completedChat.choices[0].message.content + '\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');

    }catch(err){
      if (err instanceof OpenAI.APIError) {
        console.error(err.status);  // e.g. 401
        console.error(err.message); // e.g. The authentication token you passed was invalid...
        console.error(err.code);  // e.g. 'invalid_api_key'
        console.error(err.type);  // e.g. 'invalid_request_error'
      } else {
        // Non-API error
        console.log(err);
      }
    }
  }

  if(interaction.commandName === 'stats'){
    console.log(`Stats request from: ${interaction.member.displayName}`);
    setRoasting();

    const game = interaction.options.get('game').value;
    const platform = interaction.options.get('platform').value;
    const target = interaction.options.get('target').member;

    /* Check for Database entry */
    const entry = usernames.find(o => o.discordId === target.id);
    if(!entry){
      interaction.reply({content: `"${target.displayName}" is not stored in the database! You can look up your stats using /stats-search`, ephemeral: true});
      console.log(`"${target.displayName}" is not stored in the database!`);
      setChilling();
      return;
    }

    /* Check if Requested Platform is valid */
    let username = entry.platforms[platform];
    if(!username){
      interaction.reply({content: `"${target.displayName}" does not have a ${platform.toUpperCase()} account in the database! You can look up your stats using /stats-search`, ephemeral: true});
      console.log(`"${target.displayName}" does not have a ${platform.toUpperCase()} account in the database!`);
      setChilling();
      return;
    }

    console.log(`Game: ${game} | Platform: ${platform} | Username: ${username}`);

    const response = await fetch(`https://public-api.tracker.gg/v2/apex/standard/profile/${platform}/${username}`, {
      headers:{
        "TRN-Api-Key": process.env.TRACKER_KEY,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
      }
    });

    const stats = await response.json();

    if(stats.message && stats.message === "API rate limit exceeded"){
      console.log(stats.message);
      await interaction.reply({
        content: "No more stat requests available at this time!",
        ephemeral: true,
      });
      setChilling();
      console.log(stats);
      return;
    }

    let generalPlatform;
    if(platform === "origin"){
      generalPlatform = 'PC';
      if(stats.data.metadata.steamInfo?.displayName){
        username = stats.data.metadata.steamInfo?.displayName;
        console.log(`Steam username: ${username}`);
      }
    } else {
      generalPlatform = 'console';
    }

    const kills = stats.data.segments.at(0).stats.kills.displayValue;
    const damage = stats.data.segments.at(0).stats.damage?.displayValue;
    const wins = stats.data.segments.at(0).stats.wins?.displayValue;
    const currentRank = stats.data.segments.at(0).stats.rankScore.metadata?.rankName;
    const currentRankScore = stats.data.segments.at(0).stats.rankScore?.displayValue
    const lifetimePeakRank = stats.data.segments.at(0).stats.lifetimePeakRankScore?.displayName;
    const lifetimePeakRankScore = stats.data.segments.at(0).stats.lifetimePeakRankScore?.displayValue;

    let prompt = `Roast my friend about ${game}. His username is ${username} and he plays on ${generalPlatform}. BE SURE to mention each of these stats of their's: they have ${kills}, `;
    let statsPrompt = `\n\nKills: ${kills}`;
    
    if(damage !== undefined){
      prompt += `they have ${damage} damage, `;
      statsPrompt += ` | Damage: ${damage}`;
    }
    if(wins !== undefined){
      prompt += `they have ${wins} wins, `;
      statsPrompt += ` | Wins: ${wins}`;
    }
    if(currentRank !== undefined){
      prompt += `their current rank is ${currentRank}, `;
      statsPrompt += ` | Current Rank: ${currentRank} (${currentRankScore})`;
    }
    if(lifetimePeakRank !== undefined){
      prompt += `their lifetime peak rank is ${lifetimePeakRank}`;
      statsPrompt += ` | Peak Rank: ${lifetimePeakRank} (${lifetimePeakRankScore})`;
    }
    statsPrompt += `\n${target}`

    await interaction.deferReply();
    try{
      const completedChat = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {"role": "system", "content": `You are a sarcastic bot with EXTREMELY inappropriate and immature jokes. You have the dialect of an articulate, but slightly ghetto person. Be sure to sprinkle in a few slang insults relative to the prompt or make up one and use it. Also include a few exclamatories to emphasize the main roasting points when possible. THE REPLY MUST BE THREE PRAGRAPHS MAX USING LESS THAN 1800 CHARACTERS.`},
          {"role": "user", "content": prompt},
        ],
      });
      console.log(completedChat.choices[0].message.content); 

      await interaction.editReply(completedChat.choices[0].message.content + statsPrompt);

    }catch(err){
      if (err instanceof OpenAI.APIError) {
        console.error(err.status);  // e.g. 401
        console.error(err.message); // e.g. The authentication token you passed was invalid...
        console.error(err.code);  // e.g. 'invalid_api_key'
        console.error(err.type);  // e.g. 'invalid_request_error'
      } else {
        // Non-API error
        console.log(err);
      }
    }
    setChilling();
  }

  if(interaction.commandName === 'stats-search'){
    console.log(`Stats search request from: ${interaction.member.displayName}`);
    setRoasting();

    const game = interaction.options.get('game').value;
    const platform = interaction.options.get('platform').value;
    let username = interaction.options.get('username').value;
    const mention = interaction.options.get('mention')?.member;

    console.log(`Game: ${game} | Platform: ${platform} | Username: ${username}`);

    /* Player Stats Endpoint */
    const response = await fetch(`https://public-api.tracker.gg/v2/apex/standard/profile/${platform}/${username}`, {
      headers:{
        "TRN-Api-Key": process.env.TRACKER_KEY,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
      }
    });

    const stats = await response.json();

    if(stats.errors){
      await interaction.reply({
        content: `Could not find the player "${username}" on ${platform.toUpperCase()}. If you're trying to see someone's stats from this discord, use /stats`,
        ephemeral: true,
      });
      setChilling();
      console.log(`Could not find the player "${username}" on ${platform.toUpperCase()}.`);
      return;
    }

    if(stats.message && stats.message === "API rate limit exceeded"){
      console.log(stats.message);
      await interaction.reply({
        content: "No more stat requests available at this time!",
        ephemeral: true,
      });
      setChilling();
      console.log(stats);
      return;
    }

    let generalPlatform;
    if(platform === "origin"){
      generalPlatform = 'PC';
      if(stats.data.metadata.steamInfo?.displayName){
        username = stats.data.metadata.steamInfo?.displayName;
        console.log(`Steam username: ${username}`);
      }
    } else {
      generalPlatform = 'console';
    }

    const kills = stats.data.segments.at(0).stats.kills.displayValue;
    const damage = stats.data.segments.at(0).stats.damage?.displayValue;
    const wins = stats.data.segments.at(0).stats.wins?.displayValue;
    const currentRank = stats.data.segments.at(0).stats.rankScore.metadata?.rankName;
    const currentRankScore = stats.data.segments.at(0).stats.rankScore?.displayValue
    const lifetimePeakRank = stats.data.segments.at(0).stats.lifetimePeakRankScore?.displayName;
    const lifetimePeakRankScore = stats.data.segments.at(0).stats.lifetimePeakRankScore?.displayValue;

    let prompt = `Roast my friend about ${game}. His username is ${username} and he plays on ${generalPlatform}. BE SURE to mention each of these stats of their's: they have ${kills}, `;
    let statsPrompt = `\n\nKills: ${kills}`;
    
    if(damage !== undefined){
      prompt += `they have ${damage} damage, `;
      statsPrompt += ` | Damage: ${damage}`;
    }
    if(wins !== undefined){
      prompt += `they have ${wins} wins, `;
      statsPrompt += ` | Wins: ${wins}`;
    }
    if(currentRank !== undefined){
      prompt += `their current rank is ${currentRank}, `;
      statsPrompt += ` | Current Rank: ${currentRank} (${currentRankScore})`;
    }
    if(lifetimePeakRank !== undefined){
      prompt += `their lifetime peak rank is ${lifetimePeakRank}`;
      statsPrompt += ` | Peak Rank: ${lifetimePeakRank} (${lifetimePeakRankScore})`;
    }
    if(mention){
      statsPrompt += `\n${mention}`;
    }

    await interaction.deferReply();
    try{
      const completedChat = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {"role": "system", "content": `You are a sarcastic bot with EXTREMELY inappropriate and immature jokes. You have the dialect of an articulate, but slightly ghetto person. Be sure to sprinkle in a few slang insults relative to the prompt or make up one and use it. Also include a few exclamatories to emphasize the main roasting points when possible. THE REPLY MUST BE THREE PRAGRAPHS MAX USING LESS THAN 1800 CHARACTERS.`},
          {"role": "user", "content": prompt},
        ],
      });
      console.log(completedChat.choices[0].message.content); 

      await interaction.editReply(completedChat.choices[0].message.content + statsPrompt);

    }catch(err){
      if (err instanceof OpenAI.APIError) {
        console.error(err.status);  // e.g. 401
        console.error(err.message); // e.g. The authentication token you passed was invalid...
        console.error(err.code);  // e.g. 'invalid_api_key'
        console.error(err.type);  // e.g. 'invalid_request_error'
      } else {
        // Non-API error
        console.log(err);
      }
    }

    setChilling();
  }

  setChilling();
})

client.on('messageCreate', message => {
  if(message.channel.id !== process.env.CHANNEL_ID) return;
  if(message.author.bot){
    message.react('🔥');
    message.react('🚨');
    message.react('🚒');
    message.react('🧯');
    message.react('🆘');
  } else {
    message.react('🔥');
  }
})

const setChilling = () => {
  client.user.setActivity({
    name: "Chilling ❄️❄️❄️",
    type: ActivityType.Custom,
  });
}
const setRoasting = () => {
  client.user.setActivity({
    name: "Cooking 🔥🔥🔥",
    type: ActivityType.Custom,
  });
}

client.login(process.env.DISCORD_TOKEN);

/*
{
  metadata: {
    startDate: {
      value: '2023-09-15T09:54:50.02382Z',
      displayValue: '2023-09-15T09:54:50.0238200Z'
    },
    endDate: {
      value: '2023-09-15T10:13:58.795628Z',
      displayValue: '2023-09-15T10:13:58.7956280Z'
    },
    duration: { value: '00:19:08.7718080', displayValue: '00:19:08.7718080' },
    isActive: { value: true, displayValue: 'True' }
  },
  matches: [
    {
      id: 'd3125f29-119e-4fd1-b838-a3d25efcf9b6',
      metadata: [Object],
      ==== Metadata Example ====
      {
        result: { value: 'unknown', displayValue: 'Unknown' },
        endDate: {
          value: '2023-09-13T20:55:08.944426Z',
          displayValue: '2023-09-13T20:55:08.9444260Z'
        },
        character: { value: 17, displayValue: 'Valkyrie' },
        characterIconUrl: {
          value: 'https://trackercdn.com/cdn/apex.tracker.gg/legends/valkyrie-tile.png',
          displayValue: 'Valkyrie'
        },
        characterStats: { value: [], displayValue: '' },
        legend: { value: 17, displayValue: 'Valkyrie' },
        legendBigImageUrl: {
          value: 'https://trackercdn.com/cdn/apex.tracker.gg/legends/valkyrie-tile.png',
          displayValue: 'Valkyrie'
        },
        legendPortraitImageUrl: {
          value: 'https://trackercdn.com/cdn/apex.tracker.gg/legends/portraits/valkyrie.png',
          displayValue: 'https://trackercdn.com/cdn/apex.tracker.gg/legends/portraits/valkyrie.png'        
        },
        legendColor: { value: '#8260A8', displayValue: '#8260A8' },
        legendStats: { value: [], displayValue: '' }
      }
      stats: [Object]     // These stats is the exact same as the stats below
    },
    {
      id: '561235d1-61f9-4479-9188-4ff08188ab62',
      metadata: [Object],
      stats: [Object]
    },
    {
      id: '7bdb253a-a41a-4e77-a4da-f92d925d5406',
      metadata: [Object],
      stats: [Object]
    }
  ],
  stats: {
    kills: {
      rank: null,
      percentile: null,
      displayName: 'Kills',
      displayCategory: 'Combat',
      category: 'combat',
      description: null,
      metadata: {},
      value: 9,
      displayValue: '9',
      displayType: 'Number'
    },
    rankScore: {
      rank: null,
      percentile: null,
      displayName: 'Rank Score',
      displayCategory: 'Game',
      category: 'game',
      description: null,
      metadata: {},
      value: 33225,
      displayValue: '33,225',
      displayType: 'Number'
    },
    rankScoreChange: {
      rank: null,
      percentile: null,
      displayName: 'Rank Score Change',
      displayCategory: 'Game',
      category: 'game',
      description: null,
      metadata: {},
      value: 0,
      displayValue: '0',
      displayType: 'Number'
    },
    arenaRankScore: {
      rank: null,
      percentile: null,
      displayName: 'Arena Rank Score',
      displayCategory: 'Game',
      category: 'game',
      description: null,
      metadata: {},
      value: 4800,
      displayValue: '4,800',
      displayType: 'Number'
    },
    wins: {
      rank: null,
      percentile: null,
      displayName: 'Wins',
      displayCategory: 'Game',
      category: 'game',
      description: null,
      metadata: {},
      value: 0,
      displayValue: '0',
      displayType: 'Number'
    },
    damage: {
      rank: null,
      percentile: null,
      displayName: 'Damage',
      displayCategory: 'Combat',
      category: 'combat',
      description: null,
      metadata: {},
      value: 4117,
      displayValue: '4,117',
      displayType: 'Number'
    },
    revives: {
      rank: null,
      percentile: null,
      displayName: 'Revives',
      displayCategory: 'Game',
      category: 'game',
      description: null,
      metadata: {},
      value: 0,
      displayValue: '0',
      displayType: 'Number'
    },
    smgKills: {
      rank: null,
      percentile: null,
      displayName: 'SMG Kills',
      displayCategory: 'Weapons',
      category: 'weapons',
      description: null,
      metadata: {},
      value: 0,
      displayValue: '0',
      displayType: 'Number'
    }
  },
  playlists: []
}
*/