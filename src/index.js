require('dotenv/config');
const { 
  Client, 
  IntentsBitField, 
  ActivityType,
} = require('discord.js');
const { OpenAI } = require('openai');
const sdk = require('api')('@genny-api/v1.0#keed2wlloy9a03');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
} = require('@discordjs/voice');

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
    interaction.reply({content: "You're in the wrong channel buddy...\nGo to the one that says: 🔥-roasting", ephemeral: true})
    return;
  }
  
  if(interaction.commandName === 'roast'){
    console.log(`Request from: ${interaction.member.displayName}`);
    client.user.setActivity({
      name: "Cooking 🔥🔥🔥",
      type: ActivityType.Custom,
    });

    const name = interaction.options.get('name').value;
    const topic = interaction.options.get('topic').value;
    const specific = interaction.options.get('specifically')?.value;
    const mention = interaction.options.get('mention')?.member;

    const voiceChannel = interaction.member.voice.channel;
    const player = createAudioPlayer();
    const resource = createAudioResource("https://cdn.lovo.ai/speaker-tts-samples/prod/mike-default.wav", {
      inputType: StreamType.Arbitrary,
    });
    console.log(resource);

    player.play(resource);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    setTimeout(() => {
      connection.subscribe(player);
    }, 3000);

    await interaction.reply({content: 'done!', ephemeral: true});

    player.on(AudioPlayerStatus.Idle, () => {
      connection.disconnect();
      console.log('left voice channel');
    });



    // CHAT GPT PROMPT
    // let prompt = `Roast my friend ${name} about how terrible they are with/in ${topic} and make it FUNNY without holding back.`;
    // let promptPreview = `Prompt { Name: ${name} | Topic: ${topic} `;
    // if(specific){
    //   prompt += `Make sure to mention and emphasize ${specific} thoughout the response.`;
    //   promptPreview += `| Specifically: ${specific} `;
    // }
    // if(mention){
    //   promptPreview += `} ${mention}\n\n`;
    // } else {
    //   promptPreview += `}\n\n`;
    // }

    // const voiceChannel = interaction.member.voice.channel;
    // let joinChannelMsg = '';
    // let promptLength = 'THE REPLY MUST BE TWO OR THREE SENTENCES MAX USING LESS THAN 500 CHARACTERS.';
    // if(!voiceChannel){
    //   joinChannelMsg = '\n\n(Join a channel next time and the bot will read your message!)';
    //   promptLength = 'THE REPLY MUST BE TWO OR THREE PRAGRAPHS MAX USING LESS THAN 1800 CHARACTERS';
    //   console.log('\nmember was not in a channel');
    // }

    // // CHAT GPT GENERATE RESPONSE
    // await interaction.deferReply();
    // try{
    //   const completedChat = await openai.chat.completions.create({
    //     model: "gpt-3.5-turbo",
    //     messages: [
    //       {"role": "system", "content": `You are a sarcastic bot with EXTREMELY inappropriate and immature jokes. You have the dialect of an articulate, but slightly ghetto person. Be sure to sprinkle in a few slang insults relative to the prompt or make up one and use it. Also include a few exclamatories to emphasize the main roasting points when possible. ${promptLength}`},
    //       {"role": "user", "content": prompt},
    //     ],
    //   });
    //   console.log(promptPreview + completedChat.choices[0].message.content); 

    //   await interaction.editReply(promptPreview + completedChat.choices[0].message.content + '\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥' + joinChannelMsg);

    //   // AI Generated Voice
    //   if(!voiceChannel) return;
      
    //   console.log('\nRequesting AI Voice...');
    //   sdk.auth(process.env.LOVO_KEY);
    //   sdk.asyncTts({
    //     speed: 1.5,
    //     text: completedChat.choices[0].message.content,
    //     speaker: '640f47812babeb0024be4252'
    //   })
    //     .then(({ data }) => {
    //       let counter = 0;
    //       const interval = setInterval(() => {
    //         console.log(`${++counter} seconds`);
    //         sdk.asyncRetrieveJob({jobId: data.id})
    //         .then(({ data }) => {
    //           if(data.status === 'done'){
    //             console.log(data.status);
    //             const audioUrl = data.data[0].urls[0];

    //             // Join voice chat
                


    //             // const connection = joinVoiceChannel({
    //             //   channelId: voiceChannel.id,
    //             //   guildId: voiceChannel.guild.id,
    //             //   adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    //             //   selfDeaf: false,
    //             // });
    //             // console.log('joined voice channel');

    //             // let player;
    //             // if (connection.state && connection.state.subscription && connection.state.subscription.player) {
    //             //   player = connection.state.subscription.player;
    //             // } else {
    //             //   player = createAudioPlayer();
    //             //   connection.subscribe(player);
    //             // }
            
    //             // let resource = createAudioResource(audioUrl);
    //             // player.play(resource);
            
    //             // player.on(AudioPlayerStatus.Idle, () => {
    //             //   connection.disconnect();
    //             //   console.log('left voice channel');
    //             // });

    //             clearInterval(interval);
    //           }
    //           else if(counter === 120){
    //             console.log('AI Voice Request Timeout');
    //             client.user.setActivity({
    //               name: "Chilling ❄️❄️❄️",
    //               type: ActivityType.Custom,
    //             });
    //             clearInterval(interval);
    //           }
    //         })
    //         .catch(err => console.error(err));
    //       }, 1000);
    //     })
    //     .catch(err => console.error(err));

    //   client.user.setActivity({
    //     name: "Chilling ❄️❄️❄️",
    //     type: ActivityType.Custom,
    //   });

    // }catch(err){
    //   if (err instanceof OpenAI.APIError) {
    //     console.error(err.status);  // e.g. 401
    //     console.error(err.message); // e.g. The authentication token you passed was invalid...
    //     console.error(err.code);  // e.g. 'invalid_api_key'
    //     console.error(err.type);  // e.g. 'invalid_request_error'
    //   } else {
    //     // Non-API error
    //     console.log(err);
    //   }
    // }
  }
})

client.login(process.env.DISCORD_TOKEN);
