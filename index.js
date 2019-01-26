const DW = 466;                 // Demon's Wheel
const BANDERSNATCH = 46601;     // Bandersnatch
const DEMOROS = 46602;          // Demoros

const dices = {
    0: {0: 'Hit ALL', 1: 'Don\'t hit RED', 2: 'Hit RED'},       // red dice
    1: {0: 'Hit ALL', 1: 'Don\'t hit BLUE', 2: 'Hit BLUE'},     // blue dice
    2: {0: 'Hit ALL', 1: 'Don\'t hit WHITE', 2: 'Hit WHITE'},   // white dice
};

module.exports = function DWGuide(mod) {
    if(mod.proxyAuthor !== 'caali' || !global.TeraProxy) {
        mod.warn('You are trying to use Demon\'s Wheel Guide on an unsupported legacy version of tera-proxy.');
        mod.warn('The module may not work as expected, and even if it works for now, it may break at any point in the future!');
        mod.warn('It is highly recommended that you download the latest official version from the #proxy channel in https://discord.gg/dUNDDtw');
    }


    let boss = null;
    let ball = null;
    let color; // 0: red, 1: blue, 2: white
    let orbit = 0; // 0: STOP, 1:clockwise, 2:counter-clockwise
    let count = 0;
    let circlecount = 0;

    mod.command.add('dw', {
        $default() {
            mod.settings.enabled = !mod.settings.enabled;
            mod.command.message(mod.settings.enabled ? 'enabled' : 'disabled');
        },
        party() {
            mod.settings.sendToParty = !mod.settings.sendToParty;
            mod.command.message(mod.settings.sendToParty ? 'Messages will be sent to the party' : 'Only you will see messages');
        },
    });

    function sendMessage(msg) {
        if (mod.settings.sendToParty) {
            mod.send('C_CHAT', 1, {
                channel: 21, //21 = p-notice, 1 = party
                message: msg,
            });
        } else {
            mod.send('S_CHAT', 1, {
                channel: 21, //21 = p-notice, 1 = party
                authorName: mod.options.niceName,
                message: msg,
            });
        }
    }

    mod.hook('S_BOSS_GAGE_INFO', 3, (event) => {
        if (!mod.settings.enabled)
            return;

        if (event.huntingZoneId === DW) {
            if([BANDERSNATCH, DEMOROS].includes(event.templateId)) {
                if (boss && event.templateId === BANDERSNATCH && event.id !== boss.id)
                    circlecount = 0;
                boss = event;
            }
        }

        if (boss && boss.curHp <= 0n)
            boss = null;
    });

    mod.hook('S_ACTION_STAGE', 8, (event) => {
        if (!mod.settings.enabled || !boss || event.gameId !== boss.id)
            return;

        switch(boss.templateId) {
            case BANDERSNATCH:
                switch(event.skill.id) {
                    case 1311: // Red inner explosion (pre 50%)
                    case 1313: // Blue inner explosion (pre 50%)
                    case 1315: // Red inner explosion (post 50%)
                    case 1317: // Blue inner explosion (post 50%)
                        sendMessage('OUT OUT OUT');
                        circlecount = 0;
                        break;
                    case 1312: // Red outer explosion (pre 50%)
                    case 1314: // Blue outer explosion (pre 50%)
                    case 1316: // Red outer explosion (post 50%)
                    case 1318: // Blue outer explosion (post 50%)
                        sendMessage('IN IN IN IN');
                        circlecount = 0;
                        break;
                    case 1306: // 1 orange circle (pre 50%)
                    case 1307: // 2 blue circles (pre 50%)
                    case 1308: // 3 red circles (pre 50%)
                    case 1309: // 4 blue circles (pre 50%)
                    case 1310: // 5 red circles (pre 50%)
                        circlecount += (event.skill.id - 1306) + 1;
                        sendMessage(`${circlecount} - ${(circlecount & 1) ? "odd - red" : "even - blue"}`);
                        break;
                    case 1319: // 1 green circle (post 50%)
                    case 1320: // 2 green circles (post 50%)
                    case 1321: // 3 green circles (post 50%)
                    case 1322: // 4 green circles (post 50%)
                    case 1323: // 5 green circles (post 50%)
                        circlecount += (event.skill.id - 1319) + 1;
                        sendMessage(`${circlecount} - ${(circlecount & 1) ? "odd - red" : "even - blue"}`);
                        break;
                }
                break;

            case DEMOROS:
                switch(event.skill.id) {
                    // Laser, 4 times
                    case 1113:
                    case 2113:
                        if(count === 0)
                            sendMessage('<font color = "#ff3300">LASER!!!!!!</font>');
                        count = (count + 1) % 4;
                        break;

                    case 1309: // First Blue Outer-inner explosion
                    case 1310: // First Red Outer-inner explosion
                        orbit = 0;
                        break;

                    case 1311: // Blue Outer-inner explosion
                    case 1314: // Red Outer-inner explosion
                        sendMessage('IN then OUT');
                        break;

                    case 1312: // Red Inner-outer explosion
                    case 1313: // Blue Inner-outer explosion
                        sendMessage('OUT then IN');
                        break;

                    case 1303: // Red,Blue,White dice? mech
                        sendMessage(dices[color][orbit]);
                        break;

                    // 1217 Blue circles, 3 times
                    case 1223: // Red circles, 3 times
                        if(count === 0)
                            sendMessage('Double RED');
                        count = (count + 1) % 3;
                        break;
                }
                break;
        }
    });

    mod.hook('S_SPAWN_NPC', 11, (event) => {
        if (!mod.settings.enabled || !boss || event.huntingZoneId !== DW)
            return;

        switch (event.templateId) {
            case 46621: // clockwise ball
                ball = event;
                orbit = 1;
                break;
            case 46622: // counterclockwise ball
                ball = event;
                orbit = 2;
                break;
        }
    });

    mod.hook('S_DESPAWN_NPC', 3, (event) => {
        if (!mod.settings.enabled || !boss || !ball)
            return;

        if(event.gameId === ball.gameId){
            if(Math.abs(event.loc.x+21927.0)<200 && Math.abs(event.loc.y-43462.6)<200) color = 0;
            if(Math.abs(event.loc.x+23881.0)<200 && Math.abs(event.loc.y-42350.3)<200) color = 0;
            if(Math.abs(event.loc.x+22896.0)<200 && Math.abs(event.loc.y-41786.0)<200) color = 1;
            if(Math.abs(event.loc.x+22911.0)<200 && Math.abs(event.loc.y-44026.0)<200) color = 1;
            if(Math.abs(event.loc.x+23847.4)<200 && Math.abs(event.loc.y-43489.7)<200) color = 2;
            if(Math.abs(event.loc.x+21960.7)<200 && Math.abs(event.loc.y-42323.2)<200) color = 2;
            sendMessage(dices[color][orbit]);
            ball = null;
        }
    });
}
