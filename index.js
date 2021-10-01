const Discord = require("discord.js");
const client = new Discord.Client();
const auth = require("./config.json");
const fs = require("fs");
var moment = require("moment");
const humanizeDuration = require("humanize-duration");
let ps;
let hoppa;
let g;

moment.relativeTimeThreshold("m", 59);

client.on("ready", () => {
  console.log(
    "Your bot is Running on Discord. All dyno`s checked and running!"
  );

  client.user.setActivity(`V4 Boss Timer`, { type: "WATCHING" });
});


let lock_message = {};
client.on("message", async (message) => {
  if (
    message.channel.id != auth.channel
  ) {
    return;
  }

  let role_of = message.member.roles.cache.find((r) => r.name === "BM");
  if (message.content[0] == "!" && !role_of) {
    var res_role = await message.channel.send("**You are not eligible for this command**")
    res_role.delete({ timeout: 2000 })
    message.content = message.content.replace("!", "");
    message.delete({ timeout: 2000 });
  }

  if (message.content.startsWith(auth.prefix + "start")) {
    message.delete({ timeout: 10000 });
    // check if process running
    if (lock_message["running"]) return
    else lock_message["running"] = true;

    let database2 = JSON.parse(fs.readFileSync("./database2.json", "utf8"));
    const args2 = message.content.slice(1).trim().split(/ +/g);
    const bossName = args2[1];
    let list = "";
    for (const key in database2) {
      list += `${database2[key][0].bossEmoji} : ${key}\n`;
    }
    let helpembxd = new Discord.MessageEmbed()
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/879643482094985226/882639462448918618/thisfornow.png"
      )
      .setColor("RANDOM")
      .setTitle("Monster's V4 Boss Timer")
      .setDescription(list)
      .setFooter("React to the emojis below to start the timer!");
    let a = await message.channel.send(helpembxd);
    ps = await a.id;
    console.log(ps);
    for (const key in database2) {
      a.react(database2[key][0].bossEmoji);
    }
    client.on("messageReactionAdd", async (reaction, user) => {
      let role1 = message.guild.roles.cache.find((r) => r.name === "BT");
      for (const key in database2) {
        if (
          reaction.emoji.name === database2[key][0].bossEmoji &&
          user.id !== client.user.id
        ) {
          console.log("clicked by ", user.username);

          let ps = Date.now()
          const time = database2[key][0].bossTime;
          const location = database2[key][0].bossLocation;
          database2[key][0].user = user.username
          database2[key][0].messagecreated = ps
          fs.writeFileSync("./database2.json", JSON.stringify(database2, null, 2))

          a.reactions
            .resolve(database2[key][0].bossEmoji)
            .users.remove(user.id);
          //   a.reactions
          //     .resolve(database2[key][0].bossEmoji)
          //     .users.remove(client.id);
          const realtime = database2[key][0].humanTime;
          var res = await message.channel
            .send(
              `**Timer started for ${key}, next spawn will be in  ${realtime} - Boss is spawning in ${location}**`
            )
          await res.delete({ timeout: 10000 })
          setTimeout(async () => {
            database2[key][0].user = ""
            database2[key][0].messagecreated = 0
            console.log("Wello")
            fs.writeFileSync("./database2.json", JSON.stringify(database2, null, 2))

            let flag = false
            let arr = (await message.channel.messages.fetch()).array()
            for (var el of arr) {
              if (el.content.includes(`**Yo, ${key} is in window! Spawning in ${location}**`)) {
                console.log("found it");
                flag = true
                break
              }
            }
            if (!flag) {
              let res = await message.channel.send(`**Yo, ${key} is in window! Spawning in ${location}**  ${role1} `)
              console.log("spawn meesage sent");
              lock_message["running"] = false;
              database2[key][0].isRunning = false;
              res.delete({ timeout: 3600000 });
            }
            else {
              let res = await message.channel.send(`**${key} already Spawning in window**`)
              res.delete({ timeout: 2000 });
            }

          }, time - 600000); // send spawn message 10 minutes prior
          break;
        }
      }
    });
  }
  if (message.content.startsWith(auth.prefix + "time")) {
    let database = JSON.parse(fs.readFileSync("./database.json", "utf8"));
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      return message.channel.send("**Only admins can use this command!**");
    }
    const args = message.content.split("\n").map((x) => x.split(/ +/));
    if (!args[0][1]) {
      return message.channel.send(
        "**Please add an emoji to change and a new time! Usage: !time (emoji) (hours) (minutes) Example: !time 😂 5 4**"
      );
    }
    if (!args[0][2]) {
      return message.channel.send(
        "**Please add an emoji to change and a new time! Usage: !time (emoji) (hours) (minutes) Example: !time 😂 5 4**"
      );
    }
    if (!args[0][3]) {
      return message.channel.send(
        "**Please add an emoji to change and a new time! Usage: !time (emoji) (hours) (minutes) Example: !time 😂 5 4**"
      );
    }
    let test1 =
      Number(args[0][2] * 60 * 60 * 1000) + Number(args[0][3] * 60 * 1000);
    for (const key in database) {
      let found = key == args[0][1];
      if (found) {
        database[args[0][1]].time = [];
        database[args[0][1]].time = [JSON.stringify(test1)];
        fs.writeFileSync("./database.json", JSON.stringify(database, null, 2))
        message.channel
          .send("**The time has been changed!**")
          .then((message) => {
            message.delete({ timeout: 10000 });
          });
        return;
      }
      if (!found) {
        return message.channel
          .send("**No timer with such emoji was found!**")
          .then((message) => {
            message.delete({ timeout: 10000 });
          });
      }
    }
  }
  if (message.content.startsWith(auth.prefix + "add")) {
    message.delete({ timeout: 10000 });
    let database2 = JSON.parse(fs.readFileSync("./database2.json", "utf8"));
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      return message.channel
        .send("**Only admins can use this command!**")
        .then((message) => {
          message.delete({ timeout: 10000 });
        });
    }

    const args2 = message.content.slice(1).trim().split(/ +/g);
    console.log(args2);
    const bossName = args2[1];
    const bossHours = args2[2];
    const bossMinutes = args2[3];
    const bossTime =
      Number(bossHours * 60 * 60 * 1000) + Number(bossMinutes * 60 * 1000);
    const bossEmoji = args2[4];
    const bossLocation = args2[5];
    const humanTime = humanizeDuration(bossTime);

    hoppa = await message.channel.messages.fetch(ps);

    await hoppa.react(bossEmoji);

    if (database2[bossName]) {
      message.channel
        .send(`**There is already an existing timer for ${bossName}**`)
        .then((message) => {
          message.delete({ timeout: 10000 });
        });
    } else {
      message.channel
        .send(
          `**You added ${bossName}, that will spawn in ${humanTime} in ${bossLocation}, react with emoji ${bossEmoji}**`
        )
        .then((message) => {
          message.delete({ timeout: 10000 });
        });
      //   hoppa2 = await message.channel.messages.fetch(ps);
      //   hoppa2.react(bossEmoji);
      database2[bossName] = [];
      database2[bossName].push({
        user: "",
        messagecreated: "",
        bossHours: bossHours,
        bossMinutes: bossMinutes,
        bossTime: bossTime,
        bossEmoji: bossEmoji,
        bossLocation: bossLocation,
        humanTime: humanTime,

      });
      fs.writeFileSync("./database2.json", JSON.stringify(database2, null, 2), (err) => {
        if (err) console.log(err);
      });
    }
  }
  if (message.content.startsWith(auth.prefix + "oldadd")) {
    let database = JSON.parse(fs.readFileSync("./database.json", "utf8"));
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      return message.channel.send("**Only admins can use this command!**");
    }
    const args = message.content.split("\n").map((x) => x.split(/ +/));

    if (!args[0][1]) {
      return message.channel.send(
        "**Please add an emoji and a time! Usage: !add (emoji) (hours) (minutes) Example: !add 😂 5 4**"
      );
    }
    if (!args[0][2]) {
      return message.channel.send(
        "**Please add an emoji and a time! Usage: !add (emoji) (hours) (minutes) Example: !add 😂 5 4**"
      );
    }
    if (!args[0][3]) {
      return message.channel.send(
        "**Please add an emoji and a time! Usage: !add (emoji) (hours) (minutes) Example: !add 😂 5 4**"
      );
    }
    let test1 =
      Number(args[0][2] * 60 * 60 * 1000) + Number(args[0][3] * 60 * 1000);
    for (const key in database) {
      let found = key == args[0][1];
      if (found) {
        return message.channel
          .send(
            "**There is already an existing timer with that emoji! Please use a different one!**"
          )
          .then((message) => {
            message.delete({ timeout: 10000 });
          });
      }
      if (!found) {
        message.channel
          .send("**The specific timer has been added!**")
          .then((message) => {
            message.delete({ timeout: 10000 });
          });
        hoppa = await message.channel.messages.fetch(ps);
        console.log(args)
        hoppa.react(args[0][1]);

        database[args[0][1]] = {
          time: [],
          user: []
        };
        database[args[0][1]].time.push(JSON.stringify(test1));
        fs.writeFileSync("./database.json", JSON.stringify(database, null, 2), (err) => {
          if (err) console.log(err);
        });
      }
    }

    client.on("messageReactionAdd", async (reaction, user) => {
      let role1 = message.guild.roles.cache.find((r) => r.name === "BT");
      if (reaction.emoji.name === args[0][1] && user.id !== client.user.id) {
        const time = database[args[0][1]].time;
        console.log(time);
        hoppa.reactions.resolve(args[0][1]).users.remove(user.id);
        hoppa.reactions.resolve(args[0][1]).users.remove(client.id);
        database[args[0][1]].user = message.author.username
        fs.writeFileSync("./database.json", JSON.stringify(database, null, 2), (err) => {
          if (err) console.log(err);
        });
        hoppa.react("🧭");
        setTimeout(() => {
          hoppa.reactions.resolve("🧭").users.remove(client.id);
          hoppa.react(args[0][1]);
          database[args[0][1]].user = ""
          fs.writeFileSync("./database.json", JSON.stringify(database, null, 2), (err) => {
            if (err) console.log(err);
          });
          message.channel
            .send(
              `**This is your reminder that the boss battle is starting soon!**` +
              ` ${role1}`
            )
            .then((message) => {
              message.delete({ timeout: database[args[0][1]].time - 10000 });
            });
        }, time - 600000);
      }
    });
  }
  if (message.content.startsWith(auth.prefix + "remove")) {
    message.delete({ timeout: 10000 });
    let database2 = JSON.parse(fs.readFileSync("./database2.json", "utf8"));
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      return message.channel
        .send("**Only admins can use this command!**")
        .then((message) => {
          message.delete({ timeout: 10000 });
        });
    }
    const args2 = message.content.slice(1).trim().split(/ +/g);
    const bossName = args2[1];
    if (!bossName) {
      return message.channel
        .send("**Please specify a boss name to remove**")
        .then((message) => {
          message.delete({ timeout: 10000 });
        });
    }

    if (!database2[bossName]) {
      return message.channel
        .send("**This boss is not listed**")
        .then((message) => {
          message.delete({ timeout: 10000 });
        });
    } else {
      //   hoppa = await message.channel.messages.fetch(ps);
      //   hoppa.reactions.resolve(args2[0][1]).users.remove(client.id);

      if (database2[bossName] !== undefined) {
        delete database2[bossName];
        console.log("tello");
        fs.writeFileSync("./database2.json", JSON.stringify(database2, null, 2))
        message.channel
          .send("**The boss timer has been deleted!**")
          .then((message) => {
            message.delete({ timeout: 10000 });
          });
      }
    }
  }
  if (message.content.startsWith(auth.prefix + "list")) {
    message.delete({ timeout: 10000 });
    let database2 = JSON.parse(fs.readFileSync("./database2.json", "utf8"));
    let list = "";
    for (const key in database2) {
      const realtime = database2[key][0].humanTime;
      list += `Boss Name: ${key}: ${realtime} interval\n`;
    }
    const embed = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setTimestamp()
      .setDescription(list);
    //   .setFooter("Your agenda planner!");
    message.channel.send(embed).then((message) => {
      message.delete({ timeout: 20000 });
    });
  }
  if (message.content.startsWith(auth.prefix + "run")) {
    message.delete({ timeout: 10000 });
    let database2 = JSON.parse(fs.readFileSync("./database2.json", "utf8"));
    let list = "";
    for (const key in database2) {
      if (database2[key][0].user.length > 0) {
        const maka = database2[key][0].user
        let g = database2[key][0].messagecreated
        const realtime = database2[key][0].messagecreated + database2[key][0].bossTime;
        let p = realtime - g
        let finalman = p / 1000 / 60
        var mins = finalman % 60;
        finalman = finalman / 60;
        let realtime1 = String(finalman).split(".")[0]
        if (mins) var show = `${realtime1}H:${mins}M`
        else var show = `${realtime1}H`

        var started = Date.now() - database2[key][0].messagecreated
        started = started / 1000
        if (started >= 86400) started = (started / 86400).toFixed(0) + "D"
        else if (started >= 3600) started = (started / 3600).toFixed(0) + "H"
        else if (started >= 60) started = (started / 60).toFixed(0) + "M"
        else started = started.toFixed(0) + "S"
        list += `**Boss Name**: ${key} - Timer: ${show} - **Started by**: ${maka} ${started} ago\n`;
      }

    }
    const embed = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setTimestamp()
      .setDescription(list);
    //   .setFooter("Your agenda planner!");
    message.channel.send(embed).then((message) => {
      message.delete({ timeout: 20000 });
    });
  }
  if (message.content.startsWith(auth.prefix + "help")) {
    const embed = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setFooter("Your available commands!")
      .addField("``!help``", "Shows this chart!", true)
      .addField(
        "``!add <boss name> <hours> <minutes> <emoji> <location>``",
        "Adds and activates a timer!",
        true
      )
      .addField("``!remove (boss name)``", "Removes a boss from the DB", true)
      .addField("``!list``", "Shows all available timers!", true)
      .addField("``!run``", "Shows all running timers!", true)
      .addField("``!running``", "Shows all running timers! (WIP)", true)
      .addField("``!refresh``", "Refreshes everything!", true)
      .addField("``!start``", "Starts the bot", true);
    message.channel.send(embed);
  }
  if (message.content.startsWith(auth.prefix + "refresh")) {
    let database2 = JSON.parse(fs.readFileSync("./database2.json", "utf8"));
    for (const key in database2) {
      if (database2[key][0].user.length > 0) {
        console.log(key)
        database2[key][0].user = ""
      }
    }
    fs.writeFileSync("./database2.json", JSON.stringify(database2, null, 2));
    message.channel.send("**The timer has been refreshed!**");
  }
});
client.login(auth.token);
