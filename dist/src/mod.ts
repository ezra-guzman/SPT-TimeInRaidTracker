import {DependencyContainer} from "tsyringe";
import {IPreAkiLoadMod} from "@spt-aki/models/external/IPreAkiLoadMod";
import {ILogger} from "@spt-aki/models/spt/utils/ILogger";
import {LogTextColor} from "@spt-aki/models/spt/logging/LogTextColor";
import {StaticRouterModService} from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import {ProfileHelper} from "@spt-aki/helpers/ProfileHelper";

import fs from "fs";
import path from "path";
import { IPmcData } from "@spt-aki/models/eft/common/IPmcData";

class Mod implements IPreAkiLoadMod
{
    preAkiLoad(container: DependencyContainer): void
    {
        let startTime: number;
        let profile: IPmcData;

        const logger = container.resolve<ILogger>("WinstonLogger");
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        staticRouterModService.registerStaticRouter(
            "StaticRoutePeekingAki",
            [
                {
                    url: "/client/raid/configuration",
                    action: (url, info, sessionId, output) =>
                    {
                        profile = container.resolve<ProfileHelper>("ProfileHelper").getPmcProfile(sessionId);
                        startTime = Date.now();
                        return output;
                    }
                }
            ],
            "aki"
        );

        staticRouterModService.registerStaticRouter(
            "StaticRoutePeekingAki2",
            [
                {
                    url: "/client/match/offline/end",
                    action: (url, info, sessionId, output) =>
                    {
                        const raidTimeElapsed = Date.now() - startTime;
                        const profileName = profile.Info.Nickname;

                        const filePath = path.join(process.cwd(), "user", "mods", "plebeianrat-TimeInRaidTracker-1.0.1", `${profileName}-time-tracker.txt`);

                        fs.readFile(filePath, "utf8", async (err, data) =>
                        {
                            let fileTimeInMilliseconds = 0;
                            const defaultText = "Time in raid: 0 hours, 0 minutes, 0 seconds";

                            if (err)
                            {
                                if (err.code === "ENOENT")
                                {
                                    // File doesn't exist. Write the initial data.
                                    await fs.writeFile(filePath, defaultText, (err) =>
                                    {
                                        if (err)
                                        {
                                            throw err;
                                        }
                                        logger.logWithColor("Time tracker: time tracking file initialized", LogTextColor.GREEN);
                                    });
                                }
                                else
                                {
                                    throw err;
                                }
                            }

                            data = data ?? defaultText;

                            // Parse the existing data
                            const matches = data.match(/(\d+) hours, (\d+) minutes, (\d+) seconds/);
                            if (matches)
                            {
                                const hours = parseInt(matches[1]);
                                const minutes = parseInt(matches[2]);
                                const seconds = parseInt(matches[3]);
                                fileTimeInMilliseconds = ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000;
                            }


                            // Add the time from the last raid
                            const totalTimePlayedInMilliseconds = fileTimeInMilliseconds + raidTimeElapsed;

                            // Convert back to hours, minutes, and seconds for storage
                            const hours = Math.floor(totalTimePlayedInMilliseconds / 1000 / 60 / 60);
                            const minutes = Math.floor((totalTimePlayedInMilliseconds / 1000 / 60) % 60);
                            const seconds = Math.floor((totalTimePlayedInMilliseconds / 1000) % 60);

                            const output = `Time in raid: ${hours} hours, ${minutes} minutes, ${seconds} seconds`;

                            fs.writeFile(filePath, output, (err) =>
                            {
                                if (err)
                                {
                                    throw err;
                                }
                                logger.logWithColor("Time tracker: time tracked successfully", LogTextColor.GREEN);
                            });
                        });

                        return output;
                    }
                }
            ],
            "aki"
        );
    }
}

module.exports = { mod: new Mod() }
