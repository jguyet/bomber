package org.web;


import org.web.bot.Bot;
import org.web.bot.ai.BotAI;
import org.web.bot.ai.ModelGeneration;
import org.web.client.message.SocketSender;
import org.web.game.world.World;
import org.web.server.WebServer;

import ch.qos.logback.classic.Level;
import org.web.utils.TimerWaiter;

import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Start {

	public static int				port = 9998;
	public static boolean			isRunning = true;
	public static WebServer			webServer;
	public static ModelGeneration   modelGeneration;
	public static int 				botPopulation = 30;
	public static ArrayList<Bot>    bots = new ArrayList<Bot>();
	public static ScheduledExecutorService scheduler	= Executors.newScheduledThreadPool(1);
	public static boolean alreadyRestarted = false;
	
	public static void main(String ...args)
	{
		//Charge la console
		Console.initialize();
		Console.refreshTitle();
		Console.begin();

		World.loadWorld();

		modelGeneration = new ModelGeneration(botPopulation);
		//Charge le serveur Web
		webServer = new WebServer();
		webServer.initialize();

		SocketSender.scheduler.scheduleAtFixedRate(() -> {
			SocketSender.sendPackets();
		}, 50, 50, TimeUnit.MILLISECONDS);

		Start.addBots();
		Start.scheduler.scheduleAtFixedRate(() -> {
//			if (alreadyRestarted) return ;
				System.out.println("Force STOP");
				Start.checkAIResult(true);
		}, 30000, 30000, TimeUnit.MILLISECONDS);
	}

	public static void addBots() {
		Start.bots = new ArrayList<Bot>();
		for (BotAI model : modelGeneration.getGeneration()) {
			Bot bot = new Bot(model);
			bots.add(bot);
			World.addBot(bot);
		}
	}

	public static void checkAIResult(boolean force) {
		int alives = 0;
		for (Bot bot : bots) {
			if (bot.isAlive()) {
				alives++;
			}
		}

		if (force) {
			for (Bot bot : bots) {
				if (bot.isAlive()) {
//					bot.addToScore(5001);
					bot.die(false);
				}
			}
			try {
				modelGeneration.saveBestModel();
				int count = 3;
				List<BotAI> bests = modelGeneration.selectBestModels(count);
//				modelGeneration.saveGen(bests);
				modelGeneration.createNextGeneration(bests);
				System.out.println("NEXT GEN START");
				World.loadWorld();
				Start.addBots();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}
}
