require('dotenv/config');
const { Client, IntentsBitField, ActivityType } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
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
    interaction.reply({content: "You're in the wrong channel buddy...\nGo to the one that says: 🔥-roasting", ephemeral: true})
    return;
  }
  
  if(interaction.commandName === 'roast'){
    client.user.setActivity({
      name: "Cooking 🔥🔥🔥",
      type: ActivityType.Custom,
    });
    const name = interaction.options.get('name').value;
    const topic = interaction.options.get('topic').value;
    const specific = interaction.options.get('specifically')?.value;

    let prompt = `Roast my friend ${name} about how terrible they are with ${topic} and make it FUNNY without holding back in a single paragraph or two. `;
    if(specific){
      prompt += `Make sure to talk about ${specific} since it makes them much worse.`;
    }

    await interaction.deferReply();

    try{
      const completedChat = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {"role": "system", "content": "You are a sarcastic bot with EXTREMELY inappropriate and immature jokes. You have the dialect of an articulate, but slightly ghetto person. Sprinkle in a few slang insults either relative to the prompt or make up one and use it. TWO PARAGRAPHS MAX."},
          {"role": "user", "content": prompt},
        ],
      });

      await interaction.editReply(completedChat.choices[0].message.content + '\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
      client.user.setActivity({
        name: "Chilling ❄️❄️❄️",
        type: ActivityType.Custom,
      });

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
})

client.login(process.env.DISCORD_TOKEN);