require('dotenv/config');
const { 
  Client, 
  IntentsBitField, 
  ActivityType,
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ActionRowBuilder, 
  ComponentType,
} = require('discord.js');
const { OpenAI } = require('openai');
const fetch = require('node-fetch');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  AudioPlayer,
  VoiceConnection,
} = require('@discordjs/voice');
const data = require('./samples').data;


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

  if(interaction.commandName === 'voice-samples'){    
    let section1 = [];
    let section2 = [];
    let section3 = [];
    let section4 = [];
    let section5 = [];
    let section6 = [];

    let count = 0;
    let section = 1;
    for(entry of data){
      if(entry.name === null || entry.sample === null || entry.name === "Eleanor") continue;
      switch(section){
        case 1:
          section1.push({
            label: entry.name,
            description: `${entry.accent} ${entry.age} ${entry.gender}`,
            value: entry.sample,
          })
          break;
        case 2:
          section2.push({
            label: entry.name,
            description: `${entry.accent} ${entry.age} ${entry.gender}`,
            value: entry.sample,
          })
          break;
        case 3:
          section3.push({
            label: entry.name,
            description: `${entry.accent} ${entry.age} ${entry.gender}`,
            value: entry.sample,
          })
          break;
        case 4:
          section4.push({
            label: entry.name,
            description: `${entry.accent} ${entry.age} ${entry.gender}`,
            value: entry.sample,
          })
          break;
        case 5:
          section5.push({
            label: entry.name,
            description: `${entry.accent} ${entry.age} ${entry.gender}`,
            value: entry.sample,
          })
          break;
        case 6:
          section6.push({
            label: entry.name,
            description: `${entry.accent} ${entry.age} ${entry.gender}`,
            value: entry.sample,
          })
          break;
        default:
          break;
      }
      if(++count === 25) {
        section++;
        count = 0;
      }
    }

    const sectionSel = interaction.options.get('section').value;
    let sectionChosen;
    switch(sectionSel){
      case 1:
        sectionChosen = section1;
        break;
      case 2:
        sectionChosen = section2;
        break;
      case 3:
        sectionChosen = section3;
        break;
      case 4:
        sectionChosen = section4;
        break;
      case 5:
        sectionChosen = section5;
        break;
      case 6:
        sectionChosen = section6;
        break;
      default:
        break;
    }

    const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(interaction.id)
    .setPlaceholder('Select a voice sample...')
    .setMaxValues(1)
    .addOptions(sectionChosen.map((voice) => 
      new StringSelectMenuOptionBuilder()
        .setLabel(voice.label)
        .setDescription(voice.description)
        .setValue(voice.value)
      )
    );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    const reply = await interaction.reply({
      components: [actionRow],
      ephemeral: true,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.customId === interaction.id,
      time: 300_000,
    });

    collector.on('collect', (interaction) => {
      interaction.reply({ content: 'The sample will play momentarily...', ephemeral: true });
      const sampleUrl = interaction.values[0];
      const channel = interaction.member.voice.channel;
        const connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
          selfDeaf: false,
        });
    
        let player;
        if (connection.state && connection.state.subscription && connection.state.subscription.player) {
          player = connection.state.subscription.player;
        } else {
          player = createAudioPlayer();
          console.log('Audio player has been created');
          connection.subscribe(player);
          console.log('player has been subscribed');
        }


        let resource = createAudioResource(sampleUrl);
        console.log(`Audio resource created with: ${sampleUrl}`);
        player.play(resource);
        
        console.log(AudioPlayerStatus.Idle);
        player.on(AudioPlayerStatus.Idle, () => {
          connection.disconnect();
          console.log('Bot has left the channel');
        });
    });
  }
  
  if(interaction.commandName === 'roast'){
    client.user.setActivity({
      name: "Cooking 🔥🔥🔥",
      type: ActivityType.Custom,
    });

    const name = interaction.options.get('name').value;
    const topic = interaction.options.get('topic').value;
    const specific = interaction.options.get('specifically')?.value;

    // CHAT GPT PROMPT
    let prompt = `Roast my friend ${name} about how terrible they are with/in ${topic} and make it FUNNY without holding back in a couple sentences. `;
    let promptPreview = `Prompt { Name: ${name} | Topic: ${topic} }\n\n`;
    if(specific){
      prompt += `Make sure to mention and emphasize ${specific} since it makes them much worse.`;
      promptPreview = `Prompt { Name: ${name} | Topic: ${topic} | Specifically: ${specific} }\n\n`
    }

    // CHAT GPT GENERATE RESPONSE
    await interaction.deferReply();
    try{
      const completedChat = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {"role": "system", "content": "You are a sarcastic bot with EXTREMELY inappropriate and immature jokes. You have the dialect of an articulate, but slightly ghetto person. Be sure to sprinkle in a few slang insults either relative to the prompt or make up one and use it. Also include a few exclamatories to emphasize the main roasting points when possible. THREE SENTENCES MAX."},
          {"role": "user", "content": prompt},
        ],
      });
      await interaction.editReply(promptPreview + completedChat.choices[0].message.content + '\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');

      if (!interaction.member.voice.channel) {
        const roastChannel = client.channels.cache.get(process.env.CHANNEL_ID);
        await roastChannel.send('Join a voice channel next time for the bot to read your message!');
        client.user.setActivity({
          name: "Chilling ❄️❄️❄️",
          type: ActivityType.Custom,
        });
        return;
      }

      // GENERATING AI VOICE LINES      
      const url1 = 'https://play.ht/api/v2/tts';
      const options1 = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          AUTHORIZATION: process.env.PLAY_HT_SECRET,
          'X-USER-ID': process.env.PLAY_HT_USER_ID
        },
        body: JSON.stringify({
          text: completedChat.choices[0].message.content,
          voice: 's3://mockingbird-prod/nathan_drake_carmelo_pampillonio_7d540ad6-7d32-41f6-8d53-2584901aa03d/voices/speaker/manifest.json', 
          quality: 'high',
          output_format: 'mp3',
          speed: 1.0,
          sample_rate: 24000,
          temperature: 0.7
        })
      };

      let res1 = await fetch(url1, options1);
      let resJson1 = await res1.json();
      let id = resJson1.id;

      // RETRIEVE AI GENERATED VOICE LINES
      if(resJson1.created !== undefined){
        const url2 = `https://play.ht/api/v2/tts/${id}`;
        const options2 = {
          method: 'GET',
          headers: {
            accept: 'application/json',
            AUTHORIZATION: process.env.PLAY_HT_SECRET,
            'X-USER-ID': process.env.PLAY_HT_USER_ID
          }
        };

        for(let i = 0; i < 30; i++){
          let res2 = await fetch(url2, options2);
          let resJson2 = await res2.json();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if(resJson2.output !== null){
            var audioUrl = resJson2.output.url;
            break;
          }
        }
    
        // const channel = interaction.member.voice.channel;
        // const connection = joinVoiceChannel({
        //   channelId: channel.id,
        //   guildId: channel.guild.id,
        //   adapterCreator: channel.guild.voiceAdapterCreator,
        //   selfDeaf: false,
        // });
    
        // let player;
        // if (connection.state && connection.state.subscription && connection.state.subscription.player) {
        //   player = connection.state.subscription.player;
        // } else {
        //   player = createAudioPlayer();
        //   connection.subscribe(player);
        // }
    
        // let resource = createAudioResource(audioUrl);
        // player.play(resource);
    
        // player.on(AudioPlayerStatus.Idle, () => {
        //   connection.disconnect();
        // });

        client.user.setActivity({
          name: "Chilling ❄️❄️❄️",
          type: ActivityType.Custom,
        });

      } else {
        console.log('The conversion for the audio file could not be created!');
      }
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
