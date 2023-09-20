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
      interaction.reply({content: `"${target.displayName}" is not stored in the database! You can look up any player's stats using /stats-search`, ephemeral: true});
      console.log(`"${target.displayName}" is not stored in the database!`);
      setChilling();
      return;
    }

    /* Check if Requested Platform is valid */
    let username = entry.platforms[platform];
    if(!username){
      interaction.reply({content: `"${target.displayName}" does not have a ${platform.toUpperCase()} account in the database! You can look up any player's stats using /stats-search`, ephemeral: true});
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
      await interaction.reply({
        content: "No more requests available at this time!",
        ephemeral: true,
      });
      console.log(stats.message);
      setChilling();
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
        content: `Could not find the player "${username}" on ${platform.toUpperCase()}. If you're trying to see someone's stats from this discord use /stats`,
        ephemeral: true,
      });
      setChilling();
      console.log(`Could not find the player "${username}" on ${platform.toUpperCase()}.`);
      return;
    }

    if(stats.message && stats.message === "API rate limit exceeded"){
      await interaction.reply({
        content: "No more requests available at this time!",
        ephemeral: true,
      });
      console.log(stats.message);
      setChilling();
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

  if(interaction.commandName === 'session'){
    console.log(`Session request from: ${interaction.member.displayName}`);
    setRoasting();

    const game = interaction.options.get('game').value;
    const platform = interaction.options.get('platform').value;
    const target = interaction.options.get('target').member;

    /* Check for Database entry */
    const entry = usernames.find(o => o.discordId === target.id);
    if(!entry){
      interaction.reply({content: `"${target.displayName}" is not stored in the database! You can look up anyone's most recent session using /session-search`, ephemeral: true});
      console.log(`"${target.displayName}" is not stored in the database!`);
      setChilling();
      return;
    }

    /* Check if Requested Platform is valid */
    let username = entry.platforms[platform];
    if(!username){
      interaction.reply({content: `"${target.displayName}" does not have a ${platform.toUpperCase()} account in the database! You can look up anyone's most recent session using /session-search`, ephemeral: true});
      console.log(`"${target.displayName}" does not have a ${platform.toUpperCase()} account in the database!`);
      setChilling();
      return;
    }

    console.log(`Game: ${game} | Platform: ${platform} | Username: ${username}`);

    /* Player Sessions Endpoint */
    const response = await fetch(`https://public-api.tracker.gg/v2/apex/standard/profile/${platform}/${username}/sessions`, {
      headers: {
        "TRN-Api-Key": process.env.TRACKER_KEY,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
      }
    });
    const sessions = await response.json();

    if(sessions.message && sessions.message === "API rate limit exceeded"){
      await interaction.reply({
        content: "No more requests available at this time!",
        ephemeral: true,
      });
      console.log(sessions.message);
      setChilling();
      return;
    }

    const lastSession = sessions.data?.items.at(0);

    let generalPlatform;
    if(platform === "origin"){
      generalPlatform = 'PC';
    } else {
      generalPlatform = 'console';
    }

    let startDate = lastSession.metadata.startDate.value;
    startDate = timeConversion(startDate);
    let duration = lastSession.metadata.duration.value;
    duration = duration.substring(0, 8);
    const nMatches = lastSession.matches.length;
    const kills = lastSession.stats.kills?.displayValue;
    const newRankScore = lastSession.stats.rankScore?.displayValue;
    const newRankValue = lastSession.stats.rankScore?.value;
    const newRankName = lastSession.stats.rankScore?.metadata.rankScoreInfo;
    const gainedRankScore = lastSession.stats.rankScoreChange?.displayValue;
    const gainedRankValue = lastSession.stats.rankScoreChange?.value;
    const wins = lastSession.stats.wins?.displayValue;

    let prompt = `Roast my friend about their most recent gaming session in ${game}. His username is ${username} and he plays on ${generalPlatform}. BE SURE to mention each of these stats of their's:
    the game session was played on ${startDate},
    the game session lasted for ${duration} minutes,
    in that session they played ${nMatches} matches,`;
    let statsPrompt = `\n\nSession Date: ${startDate} | Duration: ${duration} | Matches Played: ${nMatches}`;

    if(kills){
      prompt += `in that session they got ${kills} kills, `;
      statsPrompt += ` | Kills: ${kills}`;
    }
    if(wins){
      prompt += `in that session they got ${wins} wins, `;
      statsPrompt += ` | Wins: ${wins}`;
    }
    if(gainedRankValue && newRankValue){
      let prevRankScore = String(newRankValue - gainedRankValue);
      if(Number(prevRankScore) > 999 && Number(prevRankScore) <= 9999) {
        prevRankScore = prevRankScore.substring(0, 1) + ',' + prevRankScore.substring(1, prevRankScore.length);
      } else if(Number(prevRankScore) > 9999) {
        prevRankScore = prevRankScore.substring(0, 2) + ',' + prevRankScore.substring(2, prevRankScore.length);
      }
      statsPrompt += ` | Prev Rank: ${prevRankScore}`;
    }
    if(gainedRankScore){
      if(gainedRankScore >= "0"){
        prompt += `in that session they gained ${gainedRankScore} rank score, `;
      }
      else {
        prompt += `in that session they lost ${gainedRankScore} rank score, `;
      }
      statsPrompt += ` | Rank Change: ${gainedRankScore}`;
    }
    if(newRankScore){
      prompt += `their rank score after the session was ${newRankScore}`;
      statsPrompt += ` | New Rank: ${newRankScore}`;
      if(newRankName){
        prompt += ` (${newRankName})`;
        statsPrompt += ` (${newRankName})`;
      }
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
  }

  if(interaction.commandName === 'session-search'){
    console.log(`Session search request from: ${interaction.member.displayName}`);
    setRoasting();

    const game = interaction.options.get('game').value;
    const platform = interaction.options.get('platform').value;
    let username = interaction.options.get('username').value;
    const mention = interaction.options.get('mention')?.member;

    console.log(`Game: ${game} | Platform: ${platform} | Username: ${username}`);

    /* Player Sessions Endpoint */
    const response = await fetch(`https://public-api.tracker.gg/v2/apex/standard/profile/${platform}/${username}/sessions`, {
      headers: {
        "TRN-Api-Key": process.env.TRACKER_KEY,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
      }
    });
    const sessions = await response.json();

    if(sessions.errors){
      await interaction.reply({
        content: `Could not find the player "${username}" on ${platform.toUpperCase()}. If you're trying to see someone's most recent session from this discord, use /session`,
        ephemeral: true,
      });
      setChilling();
      console.log(`Could not find the player "${username}" on ${platform.toUpperCase()}.`);
      return;
    }

    if(sessions.message && sessions.message === "API rate limit exceeded"){
      await interaction.reply({
        content: "No more requests available at this time!",
        ephemeral: true,
      });
      console.log(sessions.message);
      setChilling();
      return;
    }

    const lastSession = sessions.data?.items.at(0);

    let generalPlatform;
    if(platform === "origin"){
      generalPlatform = 'PC';
    } else {
      generalPlatform = 'console';
    }

    let startDate = lastSession.metadata.startDate.value;
    startDate = timeConversion(startDate);
    let duration = lastSession.metadata.duration.value;
    duration = duration.substring(0, 8);
    const nMatches = lastSession.matches.length;
    const kills = lastSession.stats.kills?.displayValue;
    const newRankScore = lastSession.stats.rankScore?.displayValue;
    const newRankValue = lastSession.stats.rankScore?.value;
    const newRankName = lastSession.stats.rankScore?.metadata.rankScoreInfo;
    const gainedRankScore = lastSession.stats.rankScoreChange?.displayValue;
    const gainedRankValue = lastSession.stats.rankScoreChange?.value;
    const wins = lastSession.stats.wins?.displayValue;

    let prompt = `Roast my friend about their most recent gaming session in ${game}. His username is ${username} and he plays on ${generalPlatform}. BE SURE to mention each of these stats of their's:
    the game session was played on ${startDate},
    the game session lasted for ${duration} minutes,
    in that session they played ${nMatches} matches,`;
    let statsPrompt = `\n\nSession Date: ${startDate} | Duration: ${duration} | Matches Played: ${nMatches}`;

    if(kills){
      prompt += `in that session they got ${kills} kills, `;
      statsPrompt += ` | Kills: ${kills}`;
    }
    if(wins){
      prompt += `in that session they got ${wins} wins, `;
      statsPrompt += ` | Wins: ${wins}`;
    }
    if(gainedRankValue && newRankValue){
      let prevRankScore = String(newRankValue - gainedRankValue);
      if(Number(prevRankScore) > 999 && Number(prevRankScore) <= 9999) {
        prevRankScore = prevRankScore.substring(0, 1) + ',' + prevRankScore.substring(1, prevRankScore.length);
      } else if(Number(prevRankScore) > 9999) {
        prevRankScore = prevRankScore.substring(0, 2) + ',' + prevRankScore.substring(2, prevRankScore.length);
      }
      statsPrompt += ` | Prev Rank: ${prevRankScore}`;
    }
    if(gainedRankScore){
      if(gainedRankScore >= "0"){
        prompt += `in that session they gained ${gainedRankScore} rank score, `;
      }
      else {
        prompt += `in that session they lost ${gainedRankScore} rank score, `;
      }
      statsPrompt += ` | Rank Change: ${gainedRankScore}`;
    }
    if(newRankScore){
      prompt += `their rank score after the session was ${newRankScore}`;
      statsPrompt += ` | New Rank: ${newRankScore}`;
      if(newRankName){
        prompt += ` (${newRankName})`;
        statsPrompt += ` (${newRankName})`;
      }
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
const timeConversion = (time) => {
  const utcDate = new Date(time);
  let pstDate = utcDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  pstDate = pstDate.substring(0, pstDate.length - 6) + pstDate.substring(pstDate.length - 3, pstDate.length);
  return pstDate;  
}

client.login(process.env.DISCORD_TOKEN);
